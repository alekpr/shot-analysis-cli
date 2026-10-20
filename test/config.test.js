import test from "node:test";
import assert from "node:assert/strict";
import { resolveConfig, validateConfig } from "../src/config.js";

test("environment selects provider and its model without stored settings", () => {
  const config = resolveConfig(null, {
    SHOT_ANALYSIS_PROVIDER: "anthropic",
    ANTHROPIC_MODEL: "claude-test-model",
    SHOT_ANALYSIS_PROMPT_PREFIX: "TEST,"
  });
  assert.deepEqual(config, {
    provider: "anthropic",
    model: "claude-test-model",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    promptPrefix: "TEST,"
  });
  assert.equal(validateConfig(config), config);
});

test("environment model overrides stored settings", () => {
  const config = resolveConfig(
    { provider: "deepseek", model: "stored-model", apiKeyEnv: "CUSTOM_KEY", promptPrefix: "DY," },
    { SHOT_ANALYSIS_PROVIDER: "deepseek", DEEPSEEK_MODEL: "env-model" }
  );
  assert.equal(config.model, "env-model");
  assert.equal(config.apiKeyEnv, "CUSTOM_KEY");
});

test("changing provider does not inherit another provider custom key name", () => {
  const config = resolveConfig(
    { provider: "gemini", model: "gemini-old", apiKeyEnv: "CUSTOM_GEMINI_KEY" },
    { SHOT_ANALYSIS_PROVIDER: "deepseek" }
  );
  assert.equal(config.model, "deepseek-chat");
  assert.equal(config.apiKeyEnv, "DEEPSEEK_API_KEY");
});
