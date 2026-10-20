import os from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const PROVIDERS = {
  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-3.5-flash",
    modelEnv: "GEMINI_MODEL",
    defaultApiKeyEnv: "GEMINI_API_KEY"
  },
  anthropic: {
    label: "Anthropic Claude",
    defaultModel: "claude-sonnet-5-5",
    modelEnv: "ANTHROPIC_MODEL",
    defaultApiKeyEnv: "ANTHROPIC_API_KEY"
  },
  deepseek: {
    label: "DeepSeek",
    defaultModel: "deepseek-chat",
    modelEnv: "DEEPSEEK_MODEL",
    defaultApiKeyEnv: "DEEPSEEK_API_KEY"
  }
};

function nearestEnvFile(startDirectory) {
  let directory = path.resolve(startDirectory);
  while (true) {
    const candidate = path.join(directory, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

export function configPath() {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "shot-analysis-cli", "settings.json");
}

export function loadEnvFiles({
  cwd = process.cwd(),
  packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  configDirectory = path.dirname(configPath())
} = {}) {
  const candidates = [
    nearestEnvFile(cwd),
    path.join(configDirectory, ".env"),
    path.join(packageRoot, ".env")
  ].filter(Boolean);
  const searched = [...new Set(candidates)];
  const loaded = [];

  for (const envFile of searched) {
    try {
      process.loadEnvFile(envFile);
      loaded.push(envFile);
    } catch (error) {
      if (error.code !== "ENOENT") throw new Error(`โหลด .env ไม่สำเร็จที่ ${envFile}: ${error.message}`);
    }
  }
  return { loaded, searched };
}

export function resolveConfig(storedConfig, environment = process.env) {
  const provider = environment.SHOT_ANALYSIS_PROVIDER || storedConfig?.provider;
  if (!provider) return null;

  const providerDefinition = PROVIDERS[provider];
  if (!providerDefinition) return { provider };

  const sameStoredProvider = storedConfig?.provider === provider;
  const stored = sameStoredProvider ? storedConfig : {};
  const defaultKeyIsAvailable = Boolean(environment[providerDefinition.defaultApiKeyEnv]);
  return {
    ...stored,
    provider,
    model: environment[providerDefinition.modelEnv] || stored.model || providerDefinition.defaultModel,
    apiKeyEnv: environment.SHOT_ANALYSIS_API_KEY_ENV
      || (defaultKeyIsAvailable ? providerDefinition.defaultApiKeyEnv : stored.apiKeyEnv)
      || providerDefinition.defaultApiKeyEnv,
    promptPrefix: environment.SHOT_ANALYSIS_PROMPT_PREFIX ?? stored.promptPrefix ?? "DY,"
  };
}

export async function loadConfig() {
  let storedConfig = null;
  try {
    storedConfig = JSON.parse(await readFile(configPath(), "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw new Error(`อ่าน settings ไม่สำเร็จ: ${error.message}`);
    }
  }
  return resolveConfig(storedConfig);
}

export async function saveConfig(config) {
  const target = configPath();
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  return target;
}

export function validateConfig(config) {
  if (!config || !PROVIDERS[config.provider]) {
    throw new Error("ยังไม่ได้ตั้งค่า LLM กรุณากำหนด SHOT_ANALYSIS_PROVIDER ใน .env หรือรัน `shot-analysis config`");
  }
  if (!config.model || !config.apiKeyEnv) {
    throw new Error("settings ไม่สมบูรณ์ กรุณารัน `shot-analysis config` อีกครั้ง");
  }
  return config;
}
