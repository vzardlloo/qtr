export const ENGINE_NAMES = ['baidu', 'youdao', 'tencent'] as const;

export type EngineName = (typeof ENGINE_NAMES)[number];

export function isEngineName(name: unknown): name is EngineName {
	return (
		typeof name === 'string' &&
		(ENGINE_NAMES as readonly string[]).includes(name)
	);
}

export type TranslateRequest = {
	text: string;
	from: string;
	to: string;
	signal?: AbortSignal;
};

export type TranslateResult = {
	text: string;
	/** Raw vendor response. Useful for debugging. */
	raw?: unknown;
};

export type EngineMeta = {
	name: EngineName;
	description: string;
};

export interface TranslatorEngine {
	readonly name: EngineName;
	translate(request: TranslateRequest): Promise<TranslateResult>;
}
