import assert from "node:assert/strict";
import test from "node:test";
import { LlmApiError, LlmClient, requestJson } from "../src/llm.js";

function response(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

test("requestJson retries 503 and respects Retry-After", async () => {
  const calls = [];
  const delays = [];
  const fetchImpl = async () => {
    calls.push(Date.now());
    return calls.length === 1
      ? response(503, { error: { message: "busy" } }, { "retry-after": "2" })
      : response(200, { ok: true });
  };
  const value = await requestJson("https://example.test", {}, {
    fetchImpl,
    sleep: async (delay) => delays.push(delay),
    random: () => 0
  });
  assert.deepEqual(value, { ok: true });
  assert.equal(calls.length, 2);
  assert.deepEqual(delays, [2000]);
});

test("requestJson does not retry a non-retryable provider error", async () => {
  let calls = 0;
  await assert.rejects(
    requestJson("https://example.test", {}, {
      fetchImpl: async () => {
        calls += 1;
        return response(400, { error: { message: "bad request" } });
      },
      sleep: async () => {}
    }),
    (error) => error instanceof LlmApiError && error.status === 400 && error.retryable === false
  );
  assert.equal(calls, 1);
});

test("requestJson retries network errors and exposes a typed final error", async () => {
  let calls = 0;
  await assert.rejects(
    requestJson("https://example.test", {}, {
      maxAttempts: 3,
      fetchImpl: async () => {
        calls += 1;
        throw new TypeError("socket closed");
      },
      sleep: async () => {},
      random: () => 0
    }),
    (error) => error instanceof LlmApiError && error.code === "ENETWORK" && error.retryable
  );
  assert.equal(calls, 3);
});

test("requestJson aborts a timed out request", async () => {
  await assert.rejects(
    requestJson("https://example.test", {}, {
      timeoutMs: 5,
      maxAttempts: 1,
      fetchImpl: async (_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      })
    }),
    (error) => error instanceof LlmApiError && error.code === "ETIMEDOUT"
  );
});

test("diagnose verifies provider JSON output", async () => {
  class DiagnosticClient extends LlmClient {
    async generate() {
      return '{"ok":true}';
    }
  }
  process.env.TEST_DIAGNOSTIC_KEY = "test";
  try {
    const client = new DiagnosticClient({ provider: "gemini", model: "test", apiKeyEnv: "TEST_DIAGNOSTIC_KEY" });
    const result = await client.diagnose();
    assert.equal(result.jsonOutput, true);
    assert.equal(result.model, "test");
  } finally {
    delete process.env.TEST_DIAGNOSTIC_KEY;
  }
});

test("provider adapters parse their documented response shapes", async () => {
  const cases = [
    ["gemini", { candidates: [{ content: { parts: [{ text: "gemini-ok" }] }, finishReason: "STOP" }] }, "gemini-ok"],
    ["anthropic", { content: [{ type: "text", text: "claude-ok" }], stop_reason: "end_turn" }, "claude-ok"],
    ["deepseek", { choices: [{ message: { content: "deepseek-ok" }, finish_reason: "stop" }] }, "deepseek-ok"]
  ];
  process.env.PROVIDER_TEST_KEY = "test";
  try {
    for (const [provider, body, expected] of cases) {
      const client = new LlmClient(
        { provider, model: "test", apiKeyEnv: "PROVIDER_TEST_KEY", retryAttempts: 1 },
        {},
        { fetchImpl: async () => response(200, body), sleep: async () => {} }
      );
      assert.equal(await client.generate({ system: "s", prompt: "p", json: true }), expected);
    }
  } finally {
    delete process.env.PROVIDER_TEST_KEY;
  }
});

test("provider adapter reports truncated output distinctly", async () => {
  process.env.PROVIDER_TEST_KEY = "test";
  try {
    const client = new LlmClient(
      { provider: "deepseek", model: "test", apiKeyEnv: "PROVIDER_TEST_KEY", retryAttempts: 1 },
      {},
      { fetchImpl: async () => response(200, { choices: [{ message: { content: "partial" }, finish_reason: "length" }] }) }
    );
    await assert.rejects(client.generate({ system: "s", prompt: "p" }), (error) => error.code === "EOUTPUT_TRUNCATED");
  } finally {
    delete process.env.PROVIDER_TEST_KEY;
  }
});

test("provider adapter rejects an empty successful response", async () => {
  process.env.PROVIDER_TEST_KEY = "test";
  try {
    const client = new LlmClient(
      { provider: "gemini", model: "test", apiKeyEnv: "PROVIDER_TEST_KEY", retryAttempts: 1 },
      {},
      { fetchImpl: async () => response(200, { candidates: [{ content: { parts: [] }, finishReason: "STOP" }] }) }
    );
    await assert.rejects(client.generate({ system: "s", prompt: "p" }), /ไม่ส่งข้อความกลับมา/);
  } finally {
    delete process.env.PROVIDER_TEST_KEY;
  }
});
