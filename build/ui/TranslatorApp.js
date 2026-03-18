import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { loadConfig, saveConfig } from '../config/config.js';
import { createEngine, listEngines } from '../engines/index.js';
import { isEngineName } from '../engines/types.js';
import { TextInput } from './TextInput.js';
import { StatusBadge } from './StatusBadge.js';
import { ResultBox } from './ResultBox.js';
import { EngineSelectPanel } from './EngineSelectPanel.js';
/**
 * Ink UI entry.
 *
 * Keybindings:
 * - Ctrl+C: exit
 * - Esc: exit (when panel closed)
 * - Tab: open/close engine panel
 * - ↑/↓ + Enter: choose engine (panel opened)
 * - Ctrl+S: persist current engine to config
 */
export function TranslatorApp({ initialEngine, defaultFrom, defaultTo, }) {
    const { exit } = useApp();
    const engines = useMemo(() => listEngines(), []);
    const [input, setInput] = useState('');
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [engineName, setEngineName] = useState('baidu');
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState();
    const [result, setResult] = useState();
    const [isEnginePanelOpen, setIsEnginePanelOpen] = useState(false);
    const [engineHighlightedIndex, setEngineHighlightedIndex] = useState(0);
    const abortRef = useRef(undefined);
    useEffect(() => {
        (async () => {
            const config = await loadConfig();
            const fromConfig = config.currentEngine;
            if (initialEngine && isEngineName(initialEngine)) {
                setEngineName(initialEngine);
                return;
            }
            if (isEngineName(fromConfig)) {
                setEngineName(fromConfig);
            }
        })();
    }, [initialEngine]);
    const openEnginePanel = () => {
        const idx = engines.findIndex((e) => e.name === engineName);
        setEngineHighlightedIndex(idx >= 0 ? idx : 0);
        setIsEnginePanelOpen(true);
    };
    useInput(async (character, key) => {
        if (key.ctrl && character === 'c') {
            exit();
            return;
        }
        if (isEnginePanelOpen) {
            if (key.escape || key.tab) {
                setIsEnginePanelOpen(false);
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
                if (chosen)
                    setEngineName(chosen.name);
                setIsEnginePanelOpen(false);
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
        if (key.escape) {
            exit();
            return;
        }
        if (key.tab) {
            openEnginePanel();
            return;
        }
        if (key.ctrl && character === 's') {
            const config = await loadConfig();
            await saveConfig({ ...config, currentEngine: engineName });
        }
        if (key.ctrl && character === 'l') {
            setInput('');
            setResult(undefined);
            setStatus('idle');
            setErrorMessage(undefined);
        }
        if (key.ctrl && character === 'f') {
            setFrom((v) => (v === 'auto' ? 'en' : 'auto'));
        }
        if (key.ctrl && character === 't') {
            setTo((v) => (v === 'zh' ? 'en' : 'zh'));
        }
    });
    useEffect(() => {
        if (!input.trim()) {
            setStatus('idle');
            setResult(undefined);
            setErrorMessage(undefined);
            return;
        }
        setStatus('loading');
        setErrorMessage(undefined);
        const timeout = setTimeout(() => {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            const request = {
                text: input,
                from,
                to,
                signal: controller.signal,
            };
            (async () => {
                try {
                    const engine = await createEngine(engineName);
                    const translated = await engine.translate(request);
                    setResult(translated);
                    setStatus('ok');
                }
                catch (error) {
                    if (controller.signal.aborted)
                        return;
                    setStatus('error');
                    setErrorMessage(error instanceof Error ? error.message : String(error));
                }
            })();
        }, 250);
        return () => {
            clearTimeout(timeout);
        };
    }, [engineName, from, input, to]);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, gap: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { children: [_jsx(Text, { color: "cyanBright", children: "qtr" }), ' ', _jsx(Text, { dimColor: true, children: "Ink \u00B7 React \u00B7 Node" })] }), _jsx(StatusBadge, { status: status })] }), _jsx(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, paddingY: 0, children: _jsxs(Box, { flexDirection: "column", width: "100%", children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { children: ["Engine: ", _jsx(Text, { color: "yellow", children: engineName }), ' ', _jsx(Text, { dimColor: true, children: "(Tab to choose)" })] }), _jsxs(Text, { children: ["from ", _jsx(Text, { color: "green", children: from }), " \u00B7 to", ' ', _jsx(Text, { color: "green", children: to })] })] }), isEnginePanelOpen && (_jsx(Box, { marginTop: 1, children: _jsx(EngineSelectPanel, { engines: engines, highlightedIndex: engineHighlightedIndex, selectedEngine: engineName }) })), _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: input, onChange: setInput, placeholder: "Type to translate\u2026", isDisabled: isEnginePanelOpen }) })] }) }), _jsx(ResultBox, { engineName: engineName, status: status, result: result, errorMessage: errorMessage }), _jsx(Text, { dimColor: true, children: "Keys: Tab engine panel \u00B7 \u2191/\u2193/Enter choose \u00B7 Ctrl+S save engine \u00B7 Ctrl+L clear \u00B7 Ctrl+F toggle from \u00B7 Ctrl+T toggle to \u00B7 Esc/Ctrl+C exit" })] }));
}
