import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {loadConfig, saveConfig} from '../config/config.js';
import {createEngine, listEngines} from '../engines/index.js';
import type {EngineName, TranslateRequest, TranslateResult} from '../engines/types.js';
import {isEngineName} from '../engines/types.js';
import {TextInput} from './TextInput.js';
import {StatusBadge} from './StatusBadge.js';
import {ResultBox} from './ResultBox.js';
import {EngineSelectPanel} from './EngineSelectPanel.js';

export type TranslatorAppProps = {
	initialEngine?: string;
	defaultFrom: string;
	defaultTo: string;
};

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
export function TranslatorApp({
	initialEngine,
	defaultFrom,
	defaultTo,
}: TranslatorAppProps) {
	const {exit} = useApp();
	const engines = useMemo(() => listEngines(), []);

	const [input, setInput] = useState('');
	const [from, setFrom] = useState(defaultFrom);
	const [to, setTo] = useState(defaultTo);
	const [engineName, setEngineName] = useState<EngineName>('baidu');
	const [status, setStatus] = useState<
		'idle' | 'loading' | 'ok' | 'error'
	>('idle');
	const [errorMessage, setErrorMessage] = useState<string | undefined>();
	const [result, setResult] = useState<TranslateResult | undefined>();

	const [isEnginePanelOpen, setIsEnginePanelOpen] = useState(false);
	const [engineHighlightedIndex, setEngineHighlightedIndex] =
		useState<number>(0);

	const abortRef = useRef<AbortController | undefined>(undefined);

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
				if (chosen) setEngineName(chosen.name);
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
			await saveConfig({...config, currentEngine: engineName});
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
	}, [engineName, from, input, to]);

	return (
		<Box flexDirection="column" padding={1} gap={1}>
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

					{isEnginePanelOpen && (
						<Box marginTop={1}>
							<EngineSelectPanel
								engines={engines}
								highlightedIndex={engineHighlightedIndex}
								selectedEngine={engineName}
							/>
						</Box>
					)}

					<Box marginTop={1}>
						<TextInput
							value={input}
							onChange={setInput}
							placeholder="Type to translate…"
							isDisabled={isEnginePanelOpen}
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
				Keys: Tab engine panel · ↑/↓/Enter choose · Ctrl+S save engine · Ctrl+L clear ·
				 Ctrl+F toggle from · Ctrl+T toggle to · Esc/Ctrl+C exit
			</Text>
		</Box>
	);
}
