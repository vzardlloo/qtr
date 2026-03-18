import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { loadConfig, saveConfig, getPreferredConfigPath } from '../config/config.js';
import { listEngines } from '../engines/index.js';
import { isEngineName } from '../engines/types.js';
import { EngineSelectPanel } from './EngineSelectPanel.js';
import { TextInput } from './TextInput.js';
const ENGINE_FIELDS = {
    baidu: [
        {
            key: 'appId',
            label: 'appId',
            placeholder: 'Baidu appId (required)',
            isRequired: true,
        },
        {
            key: 'appSecret',
            label: 'appSecret',
            placeholder: 'Baidu appSecret (required)',
            isRequired: true,
            isSecret: true,
        },
    ],
    youdao: [
        {
            key: 'appKey',
            label: 'appKey',
            placeholder: 'Youdao appKey (required)',
            isRequired: true,
        },
        {
            key: 'appSecret',
            label: 'appSecret',
            placeholder: 'Youdao appSecret (required)',
            isRequired: true,
            isSecret: true,
        },
    ],
    tencent: [
        {
            key: 'secretId',
            label: 'secretId',
            placeholder: 'Tencent secretId (required)',
            isRequired: true,
        },
        {
            key: 'secretKey',
            label: 'secretKey',
            placeholder: 'Tencent secretKey (required)',
            isRequired: true,
            isSecret: true,
        },
        {
            key: 'region',
            label: 'region',
            placeholder: 'Tencent region (default: ap-guangzhou)',
            isRequired: false,
        },
    ],
};
const ENGINE_APPLY_GUIDE = {
    baidu: {
        url: 'https://fanyi-api.baidu.com/',
        hint: '打开后创建应用，获取 appId/appSecret。',
    },
    youdao: {
        url: 'https://ai.youdao.com/',
        hint: '打开后创建应用，获取 appKey/appSecret。',
    },
    tencent: {
        url: 'https://cloud.tencent.com/product/tmt',
        hint: '开通机器翻译服务后，在腾讯云控制台获取 SecretId/SecretKey。',
    },
};
export function ConfigSetupApp({ initialEngine }) {
    const { exit } = useApp();
    const engines = useMemo(() => listEngines(), []);
    const [step, setStep] = useState(() => initialEngine && isEngineName(initialEngine) ? 'fields' : 'select-engine');
    const [engineName, setEngineName] = useState(() => initialEngine && isEngineName(initialEngine) ? initialEngine : undefined);
    const [engineHighlightedIndex, setEngineHighlightedIndex] = useState(0);
    const [fieldIndex, setFieldIndex] = useState(0);
    const [values, setValues] = useState({});
    const [validationError, setValidationError] = useState();
    const [isSaving, setIsSaving] = useState(false);
    const [savedPath, setSavedPath] = useState();
    useEffect(() => {
        if (!engineName)
            return;
        (async () => {
            const config = await loadConfig();
            const existing = config.engines[engineName];
            setValues(existing ? { ...existing } : {});
            setFieldIndex(0);
            setValidationError(undefined);
            const idx = engines.findIndex((e) => e.name === engineName);
            setEngineHighlightedIndex(idx >= 0 ? idx : 0);
        })();
    }, [engineName, engines]);
    useInput(async (character, key) => {
        if (key.ctrl && character === 'c') {
            exit();
            return;
        }
        if (step === 'done') {
            exit();
            return;
        }
        if (step === 'select-engine') {
            if (key.escape) {
                exit();
                return;
            }
            if (key.upArrow) {
                setEngineHighlightedIndex((previousIndex) => previousIndex === 0 ? engines.length - 1 : previousIndex - 1);
            }
            if (key.downArrow) {
                setEngineHighlightedIndex((previousIndex) => previousIndex === engines.length - 1 ? 0 : previousIndex + 1);
            }
            if (key.return) {
                const chosen = engines[engineHighlightedIndex];
                if (chosen) {
                    setEngineName(chosen.name);
                    setStep('fields');
                }
                return;
            }
            if (character && !key.ctrl && !key.meta) {
                const letter = character.trim().slice(0, 1).toLowerCase();
                if (letter) {
                    const matches = engines
                        .map((e, i) => (e.name.startsWith(letter) ? i : -1))
                        .filter((i) => i >= 0);
                    if (matches.length > 0) {
                        setEngineHighlightedIndex((current) => {
                            const currentMatchIdx = matches.findIndex((m) => m === current);
                            const nextMatch = currentMatchIdx >= 0
                                ? matches[(currentMatchIdx + 1) % matches.length]
                                : matches[0];
                            return nextMatch;
                        });
                    }
                }
            }
            return;
        }
        if (step === 'fields') {
            if (key.escape) {
                setStep('select-engine');
                return;
            }
            if (isSaving)
                return;
            if (key.return) {
                setValidationError(undefined);
                if (!engineName)
                    return;
                const fields = ENGINE_FIELDS[engineName];
                const current = fields[fieldIndex];
                const value = values[current.key]?.trim() ?? '';
                if (current.isRequired && !value) {
                    setValidationError(`${current.label} is required`);
                    return;
                }
                if (fieldIndex < fields.length - 1) {
                    setFieldIndex((v) => v + 1);
                    return;
                }
                // Save.
                setIsSaving(true);
                try {
                    const config = await loadConfig();
                    const nextEngines = {
                        ...config.engines,
                        [engineName]: normalizeEngineValues(engineName, values),
                    };
                    await saveConfig({ ...config, engines: nextEngines });
                    setSavedPath(getPreferredConfigPath());
                    setStep('done');
                }
                finally {
                    setIsSaving(false);
                }
            }
        }
    });
    const highlightedEngineName = engines[engineHighlightedIndex]?.name ?? 'baidu';
    if (step === 'select-engine') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, gap: 1, children: [_jsxs(Text, { children: [_jsx(Text, { color: "cyanBright", children: "qtr" }), " ", _jsx(Text, { dimColor: true, children: "config setup" })] }), _jsx(EngineSelectPanel, { engines: engines, highlightedIndex: engineHighlightedIndex, selectedEngine: (isEngineName(initialEngine) && initialEngine) || 'baidu' }), _jsxs(Text, { dimColor: true, children: ["\u7533\u8BF7\u5730\u5740: ", _jsx(Text, { color: "cyan", children: ENGINE_APPLY_GUIDE[highlightedEngineName].url })] }), _jsx(Text, { dimColor: true, children: ENGINE_APPLY_GUIDE[highlightedEngineName].hint }), _jsx(Text, { dimColor: true, children: "Esc: exit" })] }));
    }
    if (step === 'done') {
        return (_jsxs(Box, { flexDirection: "column", padding: 1, gap: 1, children: [_jsxs(Text, { children: [_jsx(Text, { color: "cyanBright", children: "qtr" }), " ", _jsx(Text, { dimColor: true, children: "config setup" })] }), _jsx(Box, { borderStyle: "round", borderColor: "green", paddingX: 1, children: _jsxs(Text, { children: ["Saved to ", _jsx(Text, { color: "green", children: savedPath })] }) }), _jsx(Text, { dimColor: true, children: "Press any key to exit." })] }));
    }
    // step === 'fields'
    if (!engineName) {
        return (_jsx(Box, { flexDirection: "column", padding: 1, children: _jsx(Text, { color: "red", children: "No engine selected." }) }));
    }
    const fields = ENGINE_FIELDS[engineName];
    const current = fields[fieldIndex];
    const currentValue = values[current.key] ?? '';
    return (_jsxs(Box, { flexDirection: "column", padding: 1, gap: 1, children: [_jsxs(Text, { children: [_jsx(Text, { color: "cyanBright", children: "qtr" }), " ", _jsx(Text, { dimColor: true, children: "config setup" })] }), _jsx(Box, { borderStyle: "round", borderColor: "yellow", paddingX: 1, paddingY: 0, children: _jsxs(Box, { flexDirection: "column", width: "100%", gap: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { children: ["Engine: ", _jsx(Text, { color: "yellow", children: engineName }), ' ', _jsx(Text, { dimColor: true, children: "(Esc to re-select)" })] }), _jsxs(Text, { dimColor: true, children: [fieldIndex + 1, "/", fields.length] })] }), _jsxs(Text, { dimColor: true, children: ["\u7533\u8BF7\u5730\u5740:", ' ', _jsx(Text, { color: "cyan", children: ENGINE_APPLY_GUIDE[engineName].url })] }), _jsx(Text, { dimColor: true, children: ENGINE_APPLY_GUIDE[engineName].hint }), _jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: [current.label, ' ', current.isRequired ? (_jsx(Text, { color: "red", children: "*" })) : (_jsx(Text, { dimColor: true, children: "(optional)" }))] }), _jsxs(Text, { dimColor: true, children: ["Current: ", maskValue(currentValue, current.isSecret)] }), _jsx(TextInput, { value: currentValue, onChange: (next) => setValues((v) => ({ ...v, [current.key]: next })), placeholder: current.placeholder }), _jsx(Text, { dimColor: true, children: "Enter: next / save" }), validationError && _jsx(Text, { color: "red", children: validationError })] })] }) }), isSaving && _jsx(Text, { color: "yellow", children: "Saving\u2026" })] }));
}
function maskValue(value, isSecret) {
    if (!value)
        return '(empty)';
    if (!isSecret)
        return value;
    return '*'.repeat(Math.min(value.length, 12));
}
function normalizeEngineValues(engineName, values) {
    switch (engineName) {
        case 'tencent': {
            return {
                secretId: values.secretId ?? '',
                secretKey: values.secretKey ?? '',
                region: (values.region ?? '').trim() || 'ap-guangzhou',
            };
        }
        case 'baidu': {
            return {
                appId: values.appId ?? '',
                appSecret: values.appSecret ?? '',
            };
        }
        case 'youdao': {
            return {
                appKey: values.appKey ?? '',
                appSecret: values.appSecret ?? '',
            };
        }
    }
}
