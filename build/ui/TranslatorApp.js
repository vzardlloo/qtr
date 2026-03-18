import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { createEngine, listEngines } from '../engines/index.js';
import { EngineSelectPanel } from './EngineSelectPanel.js';
import { LanguageSelectPanel } from './LanguageSelectPanel.js';
import { ResultBox } from './ResultBox.js';
import { StatusBadge } from './StatusBadge.js';
import { TextInput } from './TextInput.js';
const LANGUAGES = [
    { code: 'auto', label: '自动' },
    { code: 'zh', label: '中文' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'es', label: 'Español' },
    { code: 'ru', label: 'Русский' },
];
export function TranslatorApp({ engineName, defaultFrom, defaultTo, isEngineConfigured, onEngineChange, onPersistEngine, onRequestSetup, }) {
    const { exit } = useApp();
    const engines = useMemo(() => listEngines(), []);
    const [input, setInput] = useState('');
    const [from, setFrom] = useState(defaultFrom);
    const [to, setTo] = useState(defaultTo);
    const [status, setStatus] = useState('idle');
    const [errorMessage, setErrorMessage] = useState();
    const [result, setResult] = useState();
    const [isEnginePanelOpen, setIsEnginePanelOpen] = useState(false);
    const [engineHighlightedIndex, setEngineHighlightedIndex] = useState(0);
    const [languagePanel, setLanguagePanel] = useState(null);
    const [languageHighlightedIndex, setLanguageHighlightedIndex] = useState(0);
    const abortRef = useRef(undefined);
    const isInputDisabled = isEnginePanelOpen || Boolean(languagePanel);
    const openEnginePanel = () => {
        const idx = engines.findIndex((e) => e.name === engineName);
        setEngineHighlightedIndex(idx >= 0 ? idx : 0);
        setIsEnginePanelOpen(true);
    };
    const openLanguagePanel = (which) => {
        const current = which === 'from' ? from : to;
        const idx = LANGUAGES.findIndex((l) => l.code === current);
        setLanguageHighlightedIndex(idx >= 0 ? idx : 0);
        setLanguagePanel(which);
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
                if (chosen) {
                    if (!isEngineConfigured(chosen.name)) {
                        onRequestSetup(chosen.name);
                        return;
                    }
                    onEngineChange(chosen.name);
                }
                setIsEnginePanelOpen(false);
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
        if (languagePanel) {
            if (key.escape || key.tab) {
                setLanguagePanel(null);
                return;
            }
            if (key.upArrow) {
                setLanguageHighlightedIndex((previousIndex) => previousIndex === 0 ? LANGUAGES.length - 1 : previousIndex - 1);
            }
            if (key.downArrow) {
                setLanguageHighlightedIndex((previousIndex) => previousIndex === LANGUAGES.length - 1 ? 0 : previousIndex + 1);
            }
            if (key.return) {
                const selected = LANGUAGES[languageHighlightedIndex];
                if (selected) {
                    if (languagePanel === 'from')
                        setFrom(selected.code);
                    if (languagePanel === 'to')
                        setTo(selected.code);
                }
                setLanguagePanel(null);
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
            await onPersistEngine(engineName);
            return;
        }
        if (key.ctrl && character === 'l') {
            setInput('');
            setResult(undefined);
            setStatus('idle');
            setErrorMessage(undefined);
            return;
        }
        if (key.ctrl && character === 'f') {
            openLanguagePanel('from');
            return;
        }
        if (key.ctrl && character === 't') {
            openLanguagePanel('to');
            return;
        }
    });
    React.useEffect(() => {
        if (isInputDisabled)
            return;
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
    }, [engineName, from, input, isInputDisabled, to]);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, gap: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { children: [_jsx(Text, { color: "cyanBright", children: "qtr" }), ' ', _jsx(Text, { dimColor: true, children: "Ink \u00B7 React \u00B7 Node" })] }), _jsx(StatusBadge, { status: status })] }), _jsx(Box, { borderStyle: "round", borderColor: "cyan", paddingX: 1, paddingY: 0, children: _jsxs(Box, { flexDirection: "column", width: "100%", children: [_jsxs(Box, { justifyContent: "space-between", children: [_jsxs(Text, { children: ["Engine: ", _jsx(Text, { color: "yellow", children: engineName }), ' ', _jsx(Text, { dimColor: true, children: "(Tab to choose)" })] }), _jsxs(Text, { children: ["from ", _jsx(Text, { color: "green", children: from }), " \u00B7 to", ' ', _jsx(Text, { color: "green", children: to })] })] }), isEnginePanelOpen && (_jsx(Box, { marginTop: 1, children: _jsx(EngineSelectPanel, { engines: engines, highlightedIndex: engineHighlightedIndex, selectedEngine: engineName }) })), languagePanel && (_jsx(Box, { marginTop: 1, children: _jsx(LanguageSelectPanel, { title: languagePanel === 'from' ? 'Choose source language' : 'Choose target language', items: LANGUAGES, highlightedIndex: languageHighlightedIndex, selectedCode: languagePanel === 'from' ? from : to }) })), _jsx(Box, { marginTop: 1, children: _jsx(TextInput, { value: input, onChange: setInput, placeholder: "Type to translate\u2026", isDisabled: isInputDisabled }) })] }) }), _jsx(ResultBox, { engineName: engineName, status: status, result: result, errorMessage: errorMessage }), _jsx(Text, { dimColor: true, children: "Keys: Tab engine \u00B7 Ctrl+F choose from \u00B7 Ctrl+T choose to \u00B7 Ctrl+S save engine \u00B7 Ctrl+L clear \u00B7 Esc/Ctrl+C exit" })] }));
}
