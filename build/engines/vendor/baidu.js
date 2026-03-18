import crypto from 'node:crypto';
/**
 * Baidu Translate Open API.
 *
 * Docs: https://fanyi-api.baidu.com/doc/21
 */
export class BaiduEngine {
    creds;
    name = 'baidu';
    constructor(creds) {
        this.creds = creds;
    }
    async translate(request) {
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
        const response = await fetch(`https://fanyi-api.baidu.com/api/trans/vip/translate?${params.toString()}`, { signal: request.signal });
        const body = (await response.json());
        if (body.error_code) {
            throw new Error(`Baidu error ${body.error_code}: ${body.error_msg ?? ''}`);
        }
        const text = (body.trans_result ?? []).map((t) => t.dst).join('\n');
        return { text, raw: body };
    }
}
