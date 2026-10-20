function requireApiKey(settings) {
  const value = process.env[settings.apiKeyEnv];
  if (!value) {
    throw new Error(`ไม่พบ API key ใน environment variable ${settings.apiKeyEnv}`);
  }
  return value;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.error?.message || body?.message || JSON.stringify(body);
    throw new Error(`LLM API ตอบกลับ ${response.status}: ${detail}`);
  }
  return body;
}

export class LlmClient {
  constructor(settings) {
    this.settings = settings;
  }

  async generate({ system, prompt, json = false, temperature = 0.3 }) {
    const apiKey = requireApiKey(this.settings);
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
    const body = await requestJson(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          responseMimeType: json ? "application/json" : "text/plain"
        }
      })
    });
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
    if (!text) throw new Error("Gemini ไม่ส่งข้อความกลับมา");
    return text;
  }

  async #anthropic({ apiKey, system, prompt }) {
    const url = `${this.settings.baseUrl || "https://api.anthropic.com"}/v1/messages`;
    const body = await requestJson(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: this.settings.model,
        max_tokens: 8192,
        system,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const text = body.content?.filter((item) => item.type === "text").map((item) => item.text).join("");
    if (!text) throw new Error("Claude ไม่ส่งข้อความกลับมา");
    return text;
  }

  async #deepseek({ apiKey, system, prompt, json, temperature }) {
    const url = `${this.settings.baseUrl || "https://api.deepseek.com"}/chat/completions`;
    const body = await requestJson(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.model,
        temperature,
        response_format: json ? { type: "json_object" } : undefined,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ]
      })
    });
    const text = body.choices?.[0]?.message?.content;
    if (!text) throw new Error("DeepSeek ไม่ส่งข้อความกลับมา");
    return text;
  }
}
