import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { loadEnvFiles, resolveConfig, validateConfig } from "../src/config.js";

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

test("provider default API key from environment overrides a stale stored key name", () => {
  const config = resolveConfig(
    { provider: "gemini", model: "stored-model", apiKeyEnv: "OLD_KEY_NAME" },
    { SHOT_ANALYSIS_PROVIDER: "gemini", GEMINI_API_KEY: "available" }
  );
  assert.equal(config.apiKeyEnv, "GEMINI_API_KEY");
});

test("loads the nearest project env before config and package env files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "shot-analysis-env-test-"));
  const project = path.join(root, "project");
  const child = path.join(project, "outputs", "clip");
  const packageRoot = path.join(root, "package");
  const configDirectory = path.join(root, "config");
  await Promise.all([mkdir(child, { recursive: true }), mkdir(packageRoot), mkdir(configDirectory)]);
  await Promise.all([
    writeFile(path.join(project, ".env"), "SHOT_ANALYSIS_ENV_TEST=project\n"),
    writeFile(path.join(packageRoot, ".env"), "SHOT_ANALYSIS_ENV_TEST=package\n")
  ]);
  delete process.env.SHOT_ANALYSIS_ENV_TEST;
  const result = loadEnvFiles({ cwd: child, packageRoot, configDirectory });
  assert.equal(process.env.SHOT_ANALYSIS_ENV_TEST, "project");
  assert.equal(result.loaded[0], path.join(project, ".env"));
  delete process.env.SHOT_ANALYSIS_ENV_TEST;
});
