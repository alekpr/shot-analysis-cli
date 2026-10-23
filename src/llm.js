export function requireApiKey(settings, envInfo = {}) {
  const value = process.env[settings.apiKeyEnv];
  if (!value) {
    const locations = envInfo.searched?.length ? `\nตำแหน่ง .env ที่ตรวจ: ${envInfo.searched.join(", ")}` : "";
    const loaded = envInfo.loaded?.length ? `\nไฟล์ .env ที่โหลดได้: ${envInfo.loaded.join(", ")}` : "";
    throw new Error(`ไม่พบ API key สำหรับ ${settings.provider} ใน environment variable ${settings.apiKeyEnv}${loaded}${locations}\nเพิ่ม ${settings.apiKeyEnv}=... ใน .env หรือ export ตัวแปรนี้ก่อนใช้งาน`);
  }
  return value;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export class LlmApiError extends Error {
  constructor(message, { status, code, retryable = false, responseBody } = {}) {
    super(message);
    this.name = "LlmApiError";
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.responseBody = responseBody;
  }
}

function retryAfterMilliseconds(value, now = Date.now()) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

function backoffMilliseconds(attempt, random = Math.random) {
  return Math.min(8_000, 500 * (2 ** attempt)) + Math.floor(random() * 251);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function requestJson(url, options, {
  timeoutMs = 60_000,
  maxAttempts = 4,
  fetchImpl = fetch,
  sleep = wait,
  random = Math.random,
  onRetry = () => {}
} = {}) {
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal });
      const rawBody = await response.text();
      let body = {};
      try {
        body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        body = rawBody ? { message: rawBody } : {};
      }
      if (!response.ok) {
        const detail = body?.error?.message || body?.message || JSON.stringify(body);
        const retryable = RETRYABLE_STATUS.has(response.status);
        const error = new LlmApiError(`LLM API ตอบกลับ ${response.status}: ${detail}`, {
          status: response.status,
          retryable,
          responseBody: body
        });
        if (!retryable || attempt === maxAttempts - 1) throw error;
        const retryAfter = retryAfterMilliseconds(response.headers.get("retry-after"));
        const delay = retryAfter ?? backoffMilliseconds(attempt, random);
        onRetry({ attempt: attempt + 1, maxAttempts, delay, error });
        await sleep(delay);
        continue;
      }
      return body;
    } catch (error) {
      if (error instanceof LlmApiError) {
        lastError = error;
        if (!error.retryable || attempt === maxAttempts - 1) throw error;
        continue;
      }
      const timedOut = controller.signal.aborted;
      const wrapped = new LlmApiError(
        timedOut ? `LLM API หมดเวลาหลัง ${timeoutMs}ms` : `เชื่อมต่อ LLM API ไม่สำเร็จ: ${error.message}`,
        { code: timedOut ? "ETIMEDOUT" : "ENETWORK", retryable: true }
      );
      lastError = wrapped;
      if (attempt === maxAttempts - 1) throw wrapped;
      const delay = backoffMilliseconds(attempt, random);
      onRetry({ attempt: attempt + 1, maxAttempts, delay, error: wrapped });
      await sleep(delay);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

export class LlmClient {
  constructor(settings, envInfo = {}, requestOptions = {}) {
    this.settings = settings;
    this.envInfo = envInfo;
    this.requestOptions = requestOptions;
  }

  #request(url, options) {
    return requestJson(url, options, {
      timeoutMs: Number(this.settings.timeoutMs) || 60_000,
      maxAttempts: Number(this.settings.retryAttempts) || 4,
      onRetry: ({ attempt, maxAttempts, delay, error }) => {
        console.warn(`LLM API ขัดข้อง (${error.message}) กำลังลองใหม่ ${attempt + 1}/${maxAttempts} ใน ${delay}ms`);
      },
      ...this.requestOptions
    });
  }

  assertConfigured() {
    requireApiKey(this.settings, this.envInfo);
  }

  async diagnose() {
    this.assertConfigured();
    const startedAt = Date.now();
    const text = await this.generate({
      system: "You are an API connectivity checker. Follow the requested output format exactly.",
      prompt: 'Return only this JSON object: {"ok":true}',
      json: true,
      temperature: 0
    });
    let parsed;
    try {
      parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""));
    } catch (error) {
      throw new Error(`provider เชื่อมต่อได้แต่ไม่ส่ง JSON ที่ถูกต้อง: ${error.message}`);
    }
    if (parsed?.ok !== true) throw new Error("provider เชื่อมต่อได้แต่ผลตรวจ JSON ไม่ตรงตามที่ร้องขอ");
    return {
      provider: this.settings.provider,
      model: this.settings.model,
      latencyMs: Date.now() - startedAt,
      jsonOutput: true
    };
  }

  async generate({ system, prompt, json = false, temperature = 0.3 }) {
    const apiKey = requireApiKey(this.settings, this.envInfo);
    if (this.settings.provider === "gemini") {
      return this.#gemini({ apiKey, system, prompt, json, temperature });
    }
    if (this.settings.provider === "anthropic") {
      return this.#anthropic({ apiKey, system, prompt });
    }
    return this.#deepseek({ apiKey, system, prompt, json, temperature });
  }

  async #gemini({ apiKey, system, prompt, json, temperature }) {
    const model = encodeURIComponent(this.settings.model);
    const url = `${this.settings.baseUrl || "https://generativelanguage.googleapis.com/v1beta"}/models/${model}:generateContent`;
    const body = await this.#request(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: json ? "application/json" : "text/plain",
          maxOutputTokens: Number(this.settings.maxOutputTokens) || 32_768
        }
      })
    });
    const candidate = body.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS") throw new LlmApiError("Gemini ตัดคำตอบเพราะถึง output token limit", { code: "EOUTPUT_TRUNCATED" });
    const text = candidate?.content?.parts?.map((part) => part.text || "").join("");
    if (!text) throw new Error("Gemini ไม่ส่งข้อความกลับมา");
    return text;
  }

  async #anthropic({ apiKey, system, prompt }) {
    const url = `${this.settings.baseUrl || "https://api.anthropic.com"}/v1/messages`;
    const body = await this.#request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.settings.model,
        max_tokens: Number(this.settings.maxOutputTokens) || 32_768,
        system,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (body.stop_reason === "max_tokens") throw new LlmApiError("Claude ตัดคำตอบเพราะถึง output token limit", { code: "EOUTPUT_TRUNCATED" });
    const text = body.content?.filter((item) => item.type === "text").map((item) => item.text).join("");
    if (!text) throw new Error("Claude ไม่ส่งข้อความกลับมา");
    return text;
  }

  async #deepseek({ apiKey, system, prompt, json, temperature }) {
    const url = `${this.settings.baseUrl || "https://api.deepseek.com"}/chat/completions`;
    const body = await this.#request(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.model,
        temperature,
        max_tokens: Number(this.settings.maxOutputTokens) || 32_768,
        response_format: json ? { type: "json_object" } : undefined,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });
    const choice = body.choices?.[0];
    if (choice?.finish_reason === "length") throw new LlmApiError("DeepSeek ตัดคำตอบเพราะถึง output token limit", { code: "EOUTPUT_TRUNCATED" });
    const text = choice?.message?.content;
    if (!text) throw new Error("DeepSeek ไม่ส่งข้อความกลับมา");
    return text;
  }
}
