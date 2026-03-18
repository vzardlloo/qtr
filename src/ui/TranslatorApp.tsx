import React, {useMemo, useRef, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';

import {createEngine, listEngines} from '../engines/index.js';
import type {EngineName, TranslateRequest, TranslateResult} from '../engines/types.js';
import {EngineSelectPanel} from './EngineSelectPanel.js';
import {LanguageSelectPanel, type LanguageItem} from './LanguageSelectPanel.js';
import {QtrBanner} from './QtrBanner.js';
import {ResultBox} from './ResultBox.js';
import {StatusBadge} from './StatusBadge.js';
import {TextInput} from './TextInput.js';

export type TranslatorAppProps = {
	engineName: EngineName;
	defaultFrom: string;
	defaultTo: string;
	isEngineConfigured: (engineName: EngineName) => boolean;
	onEngineChange: (engineName: EngineName) => void;
	onPersistEngine: (engineName: EngineName) => Promise<void>;
	onRequestSetup: (engineName: EngineName) => void;
};

const LANGUAGES: LanguageItem[] = [
	{code: 'auto', label: '自动'},
	{code: 'zh', label: '中文'},
	{code: 'en', label: 'English'},
	{code: 'ja', label: '日本語'},
	{code: 'ko', label: '한국어'},
	{code: 'fr', label: 'Français'},
	{code: 'de', label: 'Deutsch'},
	{code: 'es', label: 'Español'},
	{code: 'ru', label: 'Русский'},
];

export function TranslatorApp({
	engineName,
	defaultFrom,
	defaultTo,
	isEngineConfigured,
	onEngineChange,
	onPersistEngine,
	onRequestSetup,
}: TranslatorAppProps) {
	const {exit} = useApp();
	const engines = useMemo(() => listEngines(), []);

	const [input, setInput] = useState('');
	const [from, setFrom] = useState(defaultFrom);
	const [to, setTo] = useState(defaultTo);
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'ok' | 'error'
	>('idle');
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [result, setResult] = useState<TranslateResult | undefined>();

	const [isEnginePanelOpen, setIsEnginePanelOpen] = useState(false);
	const [engineHighlightedIndex, setEngineHighlightedIndex] =
		useState<number>(0);

	const [languagePanel, setLanguagePanel] = useState<null | 'from' | 'to'>(null);
	const [languageHighlightedIndex, setLanguageHighlightedIndex] =
		useState<number>(0);

	const abortRef = useRef<AbortController | undefined>(undefined);

	const isInputDisabled = isEnginePanelOpen || Boolean(languagePanel);

	const openEnginePanel = () => {
		const idx = engines.findIndex((e) => e.name === engineName);
		setEngineHighlightedIndex(idx >= 0 ? idx : 0);
		setIsEnginePanelOpen(true);
	};

	const openLanguagePanel = (which: 'from' | 'to') => {
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
				setEngineHighlightedIndex((previousIndex) =>
					previousIndex === 0 ? engines.length - 1 : previousIndex - 1,
				);
			}

			if (key.downArrow) {
				setEngineHighlightedIndex((previousIndex) =>
					previousIndex === engines.length - 1 ? 0 : previousIndex + 1,
				);
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
							const nextMatch =
								currentMatchIdx >= 0
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
				setLanguageHighlightedIndex((previousIndex) =>
					previousIndex === 0 ? LANGUAGES.length - 1 : previousIndex - 1,
				);
			}

			if (key.downArrow) {
				setLanguageHighlightedIndex((previousIndex) =>
					previousIndex === LANGUAGES.length - 1 ? 0 : previousIndex + 1,
				);
			}

			if (key.return) {
				const selected = LANGUAGES[languageHighlightedIndex];
				if (selected) {
					if (languagePanel === 'from') setFrom(selected.code);
					if (languagePanel === 'to') setTo(selected.code);
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
		if (isInputDisabled) return;

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

			const request: TranslateRequest = {
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
				} catch (error) {
					if (controller.signal.aborted) return;

					setStatus('error');
					setErrorMessage(error instanceof Error ? error.message : String(error));
				}
			})();
		}, 250);

		return () => {
			clearTimeout(timeout);
		};
	}, [engineName, from, input, isInputDisabled, to]);

	return (
		<Box flexDirection="column" padding={1} gap={1}>
			<QtrBanner />
			<Box justifyContent="space-between">
				<Text>
					<Text color="cyanBright">qtr</Text>{' '}
					<Text dimColor>Ink · React · Node</Text>
				</Text>
				<StatusBadge status={status} />
			</Box>

			<Box borderStyle="round" borderColor="cyan" paddingX={1} paddingY={0}>
				<Box flexDirection="column" width="100%">
					<Box justifyContent="space-between">
						<Text>
							Engine: <Text color="yellow">{engineName}</Text>{' '}
							<Text dimColor>(Tab to choose)</Text>
						</Text>
						<Text>
							from <Text color="green">{from}</Text> · to{' '}
							<Text color="green">{to}</Text>
						</Text>
					</Box>

					{isEnginePanelOpen ? (
						<Box marginTop={1}>
							<EngineSelectPanel
								engines={engines}
								highlightedIndex={engineHighlightedIndex}
								selectedEngine={engineName}
							/>
						</Box>
					) : null}

					{languagePanel ? (
						<Box marginTop={1}>
							<LanguageSelectPanel
								title={
									languagePanel === 'from'
										? 'Choose source language'
										: 'Choose target language'
								}
								items={LANGUAGES}
								highlightedIndex={languageHighlightedIndex}
								selectedCode={languagePanel === 'from' ? from : to}
							/>
						</Box>
					) : null}

					<Box marginTop={1}>
						<TextInput
							value={input}
							onChange={setInput}
							placeholder="Type to translate…"
							isDisabled={isInputDisabled}
						/>
					</Box>
				</Box>
			</Box>

			<ResultBox
				engineName={engineName}
				status={status}
				result={result}
				errorMessage={errorMessage}
			/>

			<Text dimColor>
				Keys: Tab engine · Ctrl+F choose from · Ctrl+T choose to · Ctrl+S save engine ·
				 Ctrl+L clear · Esc/Ctrl+C exit
			</Text>
		</Box>
	);
}
