import type {TranslateRequest, TranslateResult, TranslatorEngine} from '../types.js';
import tencentcloud from 'tencentcloud-sdk-nodejs';

type TencentCreds = {
	secretId: string;
	secretKey: string;
	region?: string;
};

/**
 * Tencent Cloud TMT.
 *
 * Docs: https://cloud.tencent.com/document/product/551
 */
export class TencentEngine implements TranslatorEngine {
	public readonly name = 'tencent' as const;

	private readonly client: any;

	public constructor(private readonly creds: TencentCreds) {
		const TmtClient = tencentcloud.tmt.v20180321.Client;
		this.client = new TmtClient({
			credential: {
				secretId: creds.secretId,
				secretKey: creds.secretKey,
			},
			region: creds.region ?? 'ap-guangzhou',
			profile: {
				httpProfile: {
					reqTimeout: 30,
				},
			},
		});
	}

	public async translate(request: TranslateRequest): Promise<TranslateResult> {
		const source = normalizeTencentLang(request.from);
		const target = normalizeTencentLang(request.to);

		const response = await this.client.TextTranslate({
			SourceText: request.text,
			Source: source,
			Target: target,
			ProjectId: 0,
		});

		return {text: response?.TargetText ?? '', raw: response};
	}
}

function normalizeTencentLang(lang: string) {
	if (lang === 'auto') return 'auto';
	if (lang === 'zh') return 'zh';
	if (lang === 'en') return 'en';
	return lang;
}
