export const ENGINE_NAMES = ['baidu', 'youdao', 'tencent'];
export function isEngineName(name) {
    return (typeof name === 'string' &&
        ENGINE_NAMES.includes(name));
}
