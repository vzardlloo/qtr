import crypto from 'node:crypto';
import type {TranslateRequest, TranslateResult, TranslatorEngine} from '../types.js';

type BaiduCreds = {
	appId: string;
	appSecret: string;
};

type BaiduResponse = {
	from?: string;
	to?: string;
	trans_result?: Array<{src: string; dst: string}>;
	error_code?: string;
	error_msg?: string;
};

/**
 * Baidu Translate Open API.
 *
 * Docs: https://fanyi-api.baidu.com/doc/21
 */
export class BaiduEngine implements TranslatorEngine {
	public readonly name = 'baidu' as const;

	public constructor(private readonly creds: BaiduCreds) {}

	public async translate(request: TranslateRequest): Promise<TranslateResult> {
		const salt = String(Date.now());
		const sign = crypto
			.createHash('md5')
			.update(this.creds.appId + request.text + salt + this.creds.appSecret)
			.digest('hex');

		const params = new URLSearchParams({
			q: request.text,
			from: request.from,
			to: request.to,
			appid: this.creds.appId,
			salt,
			sign,
		});

		const response = await fetch(
			`https://fanyi-api.baidu.com/api/trans/vip/translate?${params.toString()}`,
			{signal: request.signal},
		);

		const body = (await response.json()) as BaiduResponse;
		if (body.error_code) {
			throw new Error(`Baidu error ${body.error_code}: ${body.error_msg ?? ''}`);
		}

		const text = (body.trans_result ?? []).map((t) => t.dst).join('\n');
		return {text, raw: body};
	}
}
