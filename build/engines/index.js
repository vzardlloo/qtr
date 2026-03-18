import { getLegacyConfigPath, getPreferredConfigPath, loadConfig, } from '../config/config.js';
export function listEngines() {
    return [
        {
            name: 'baidu',
            description: 'Baidu Translate Open API (appid + secret)',
        },
        {
            name: 'youdao',
            description: 'Youdao AI Open API (appKey + appSecret)',
        },
        {
            name: 'tencent',
            description: 'Tencent Cloud TMT (secretId + secretKey)',
        },
    ];
}
export async function createEngine(name) {
    const config = await loadConfig();
    const configHint = `${getPreferredConfigPath()} (legacy: ${getLegacyConfigPath()})`;
    switch (name) {
        case 'baidu': {
            const creds = config.engines.baidu;
            if (!creds?.appId || !creds?.appSecret) {
                throw new Error(`Baidu engine not configured. Please fill engines.baidu.appId/appSecret in ${configHint}`);
            }
            const { BaiduEngine } = await import('./vendor/baidu.js');
            return new BaiduEngine(creds);
        }
        case 'youdao': {
            const creds = config.engines.youdao;
            if (!creds?.appKey || !creds?.appSecret) {
                throw new Error(`Youdao engine not configured. Please fill engines.youdao.appKey/appSecret in ${configHint}`);
            }
            const { YoudaoEngine } = await import('./vendor/youdao.js');
            return new YoudaoEngine(creds);
        }
        case 'tencent': {
            const creds = config.engines.tencent;
            if (!creds?.secretId || !creds?.secretKey) {
                throw new Error(`Tencent engine not configured. Please fill engines.tencent.secretId/secretKey in ${configHint}`);
            }
            const { TencentEngine } = await import('./vendor/tencent.js');
            return new TencentEngine(creds);
        }
    }
}
