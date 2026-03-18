import tencentcloud from 'tencentcloud-sdk-nodejs';
/**
 * Tencent Cloud TMT.
 *
 * Docs: https://cloud.tencent.com/document/product/551
 */
export class TencentEngine {
    creds;
    name = 'tencent';
    client;
    constructor(creds) {
        this.creds = creds;
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
    async translate(request) {
        const source = normalizeTencentLang(request.from);
        const target = normalizeTencentLang(request.to);
        const response = await this.client.TextTranslate({
            SourceText: request.text,
            Source: source,
            Target: target,
            ProjectId: 0,
        });
        return { text: response?.TargetText ?? '', raw: response };
    }
}
function normalizeTencentLang(lang) {
    if (lang === 'auto')
        return 'auto';
    if (lang === 'zh')
        return 'zh';
    if (lang === 'en')
        return 'en';
    return lang;
}
