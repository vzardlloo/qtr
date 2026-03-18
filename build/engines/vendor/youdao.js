import crypto from 'node:crypto';
/**
 * Youdao AI Open API.
 *
 * Docs: https://ai.youdao.com/DOCSIRMA/html/%E8%87%AA%E7%84%B6%E8%AF%AD%E8%A8%80%E7%BF%BB%E8%AF%91/%E7%BF%BB%E8%AF%91API%E6%96%87%E6%A1%A3/%E7%BF%BB%E8%AF%91API%E6%96%87%E6%A1%A3.html
 */
export class YoudaoEngine {
    creds;
    name = 'youdao';
    constructor(creds) {
        this.creds = creds;
    }
    async translate(request) {
        const salt = crypto.randomUUID();
        const curtime = Math.floor(Date.now() / 1000).toString();
        const sign = crypto
            .createHash('sha256')
            .update(this.creds.appKey +
            truncate(request.text) +
            salt +
            curtime +
            this.creds.appSecret)
            .digest('hex');
        const body = new URLSearchParams({
            q: request.text,
            from: request.from,
            to: request.to,
            appKey: this.creds.appKey,
            salt,
            sign,
            signType: 'v3',
            curtime,
        });
        const response = await fetch('https://openapi.youdao.com/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body,
            signal: request.signal,
        });
        const json = (await response.json());
        if (json.errorCode !== '0') {
            throw new Error(`Youdao error ${json.errorCode}`);
        }
        return { text: (json.translation ?? []).join('\n'), raw: json };
    }
}
function truncate(q) {
    const size = q.length;
    if (size <= 20)
        return q;
    return q.slice(0, 10) + size + q.slice(size - 10);
}
