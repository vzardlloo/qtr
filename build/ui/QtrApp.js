import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Text, useApp } from 'ink';
import { hasAnyEngineConfigured, isEngineConfigured, loadConfig, saveConfig, } from '../config/config.js';
import { isEngineName } from '../engines/types.js';
import { ConfigSetupApp } from './ConfigSetupApp.js';
import { TranslatorApp } from './TranslatorApp.js';
export function QtrApp({ initialEngine, defaultFrom, defaultTo }) {
    const { exit } = useApp();
    const [config, setConfig] = useState();
    const [mode, setMode] = useState('translator');
    const [engineName, setEngineName] = useState('baidu');
    const [setupEngine, setSetupEngine] = useState();
    useEffect(() => {
        (async () => {
            const cfg = await loadConfig();
            setConfig(cfg);
            const preferredEngine = initialEngine && isEngineName(initialEngine)
                ? initialEngine
                : cfg.currentEngine;
            setEngineName(preferredEngine);
            const hasAny = hasAnyEngineConfigured(cfg);
            if (!hasAny) {
                setMode('setup');
                setSetupEngine(initialEngine && isEngineName(initialEngine) ? initialEngine : undefined);
                return;
            }
            // When user explicitly selects (or config points to) an engine without creds,
            // guide them to setup for that engine.
            if (!isEngineConfigured(cfg, preferredEngine)) {
                setMode('setup');
                setSetupEngine(preferredEngine);
            }
            else {
                setMode('translator');
                setSetupEngine(undefined);
            }
        })();
    }, [initialEngine]);
    if (!config) {
        return _jsx(Text, { dimColor: true, children: "Loading\u2026" });
    }
    const configured = config;
    const persistEngine = async (nextEngineName) => {
        const next = { ...configured, currentEngine: nextEngineName };
        await saveConfig(next);
        setConfig(next);
    };
    const pickFallbackEngine = (candidate) => {
        if (isEngineConfigured(configured, candidate))
            return candidate;
        for (const name of ['baidu', 'youdao', 'tencent']) {
            if (isEngineConfigured(configured, name))
                return name;
        }
        return candidate;
    };
    if (mode === 'setup') {
        return (_jsx(ConfigSetupApp, { initialEngine: setupEngine, exitOnDone: false, onCancel: () => {
                if (!hasAnyEngineConfigured(configured)) {
                    exit();
                    return;
                }
                setEngineName((current) => pickFallbackEngine(current));
                setSetupEngine(undefined);
                setMode('translator');
            }, onDone: async (doneEngineName) => {
                const next = await loadConfig();
                setConfig(next);
                setEngineName(doneEngineName);
                setMode('translator');
            } }));
    }
    return (_jsx(TranslatorApp, { engineName: engineName, defaultFrom: defaultFrom, defaultTo: defaultTo, isEngineConfigured: (candidate) => isEngineConfigured(configured, candidate), onEngineChange: setEngineName, onPersistEngine: persistEngine, onRequestSetup: (candidate) => {
            setSetupEngine(candidate);
            setMode('setup');
        } }));
}
