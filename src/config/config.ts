import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type {EngineName} from '../engines/types.js';
import {isEngineName} from '../engines/types.js';

export type TranslatorConfig = {
	currentEngine: EngineName;
	engines: {
		baidu?: {
			appId: string;
			appSecret: string;
		};
		youdao?: {
			appKey: string;
			appSecret: string;
		};
		tencent?: {
			secretId: string;
			secretKey: string;
			region?: string;
		};
	};
};

const DEFAULT_CONFIG: TranslatorConfig = {
	currentEngine: 'baidu',
	engines: {
		baidu: {appId: '', appSecret: ''},
		youdao: {appKey: '', appSecret: ''},
		tencent: {secretId: '', secretKey: '', region: 'ap-guangzhou'},
	},
};

const PREFERRED_CONFIG_FILENAME = '.qtr-config.json';
const LEGACY_CONFIG_FILENAME = '.translator-config.json';

export function getPreferredConfigPath() {
	return path.join(os.homedir(), PREFERRED_CONFIG_FILENAME);
}

export function getLegacyConfigPath() {
	return path.join(os.homedir(), LEGACY_CONFIG_FILENAME);
}

/**
 * Create preferred config file if missing.
 *
 * If legacy config exists but preferred one doesn't, it will be migrated to the
 * preferred location.
 */
export async function initConfigIfMissing(options?: {force?: boolean}) {
	const preferredPath = getPreferredConfigPath();
	const legacyPath = getLegacyConfigPath();

	if (!options?.force) {
		try {
			await fs.access(preferredPath);
			return;
		} catch {
			// Ignore.
		}

		try {
			await fs.access(legacyPath);
			const legacyRaw = await fs.readFile(legacyPath, 'utf8');
			await fs.writeFile(preferredPath, ensureTrailingNewline(legacyRaw));
			return;
		} catch {
			// Ignore.
		}
	}

	await fs.writeFile(
		preferredPath,
		JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n',
	);
}

export async function loadConfig(): Promise<TranslatorConfig> {
	const preferred = await readConfigFile(getPreferredConfigPath());
	if (preferred) return preferred;

	const legacy = await readConfigFile(getLegacyConfigPath());
	if (legacy) return legacy;

	return DEFAULT_CONFIG;
}

export async function saveConfig(config: TranslatorConfig) {
	await fs.writeFile(
		getPreferredConfigPath(),
		JSON.stringify(config, null, 2) + '\n',
	);
}

export async function setCurrentEngine(engine: string) {
	if (!isEngineName(engine)) {
		throw new Error(`Unknown engine: ${engine}`);
	}

	const config = await loadConfig();
	await saveConfig({...config, currentEngine: engine});
}

export function hasAnyEngineConfigured(config: TranslatorConfig) {
	const baidu = config.engines.baidu;
	const youdao = config.engines.youdao;
	const tencent = config.engines.tencent;

	return Boolean(
		(baidu?.appId && baidu.appSecret) ||
			(youdao?.appKey && youdao.appSecret) ||
			(tencent?.secretId && tencent.secretKey),
	);
}

export function isEngineConfigured(config: TranslatorConfig, engineName: EngineName) {
	switch (engineName) {
		case 'baidu': {
			const creds = config.engines.baidu;
			return Boolean(creds?.appId && creds.appSecret);
		}
		case 'youdao': {
			const creds = config.engines.youdao;
			return Boolean(creds?.appKey && creds.appSecret);
		}
		case 'tencent': {
			const creds = config.engines.tencent;
			return Boolean(creds?.secretId && creds.secretKey);
		}
	}
}

async function readConfigFile(configPath: string): Promise<TranslatorConfig | undefined> {
	try {
		const raw = await fs.readFile(configPath, 'utf8');
		const parsed = JSON.parse(raw) as Partial<TranslatorConfig>;

		return {
			...DEFAULT_CONFIG,
			...parsed,
			currentEngine: isEngineName(parsed.currentEngine)
				? parsed.currentEngine
				: DEFAULT_CONFIG.currentEngine,
			engines: {
				...DEFAULT_CONFIG.engines,
				...parsed.engines,
			},
		};
	} catch {
		return undefined;
	}
}

function ensureTrailingNewline(content: string) {
	return content.endsWith('\n') ? content : content + '\n';
}
