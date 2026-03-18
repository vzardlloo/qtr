import React, {useEffect, useMemo, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {loadConfig, saveConfig, getPreferredConfigPath} from '../config/config.js';
import {listEngines} from '../engines/index.js';
import type {EngineName} from '../engines/types.js';
import {isEngineName} from '../engines/types.js';
import {EngineSelectPanel} from './EngineSelectPanel.js';
import {TextInput} from './TextInput.js';

export type ConfigSetupAppProps = {
	initialEngine?: string;
};

type Field = {
	key: string;
	label: string;
	placeholder: string;
	isRequired: boolean;
	isSecret?: boolean;
};

const ENGINE_FIELDS: Record<EngineName, Field[]> = {
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

const ENGINE_APPLY_GUIDE: Record<
	EngineName,
	{
		url: string;
		hint: string;
	}
> = {
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

export function ConfigSetupApp({initialEngine}: ConfigSetupAppProps) {
	const {exit} = useApp();
	const engines = useMemo(() => listEngines(), []);

	const [step, setStep] = useState<'select-engine' | 'fields' | 'done'>(() =>
		initialEngine && isEngineName(initialEngine) ? 'fields' : 'select-engine',
	);
	const [engineName, setEngineName] = useState<EngineName | undefined>(() =>
		initialEngine && isEngineName(initialEngine) ? initialEngine : undefined,
	);

	const [engineHighlightedIndex, setEngineHighlightedIndex] =
		useState<number>(0);

	const [fieldIndex, setFieldIndex] = useState(0);
	const [values, setValues] = useState<Record<string, string>>({});
	const [validationError, setValidationError] = useState<string | undefined>();
	const [isSaving, setIsSaving] = useState(false);
	const [savedPath, setSavedPath] = useState<string | undefined>();

	useEffect(() => {
		if (!engineName) return;

		(async () => {
			const config = await loadConfig();
			const existing = (config.engines as any)[engineName] as
				| Record<string, string>
				| undefined;
			setValues(existing ? {...existing} : {});
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

		if (step === 'fields') {
			if (key.escape) {
				setStep('select-engine');
				return;
			}

			if (isSaving) return;

			if (key.return) {
				setValidationError(undefined);
				if (!engineName) return;

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
					} as any;

					await saveConfig({
						...config,
						currentEngine: engineName,
						engines: nextEngines,
					});
					setSavedPath(getPreferredConfigPath());
					setStep('done');
				} finally {
					setIsSaving(false);
				}
			}
		}
	});

	const highlightedEngineName =
		engines[engineHighlightedIndex]?.name ?? ('baidu' as const);

	if (step === 'select-engine') {
		return (
			<Box flexDirection="column" padding={1} gap={1}>
				<Text>
					<Text color="cyanBright">qtr</Text> <Text dimColor>config setup</Text>
				</Text>
				<EngineSelectPanel
					engines={engines}
					highlightedIndex={engineHighlightedIndex}
					selectedEngine={
						(isEngineName(initialEngine) && initialEngine) || 'baidu'
					}
				/>
				<Text dimColor>
					申请地址: <Text color="cyan">{ENGINE_APPLY_GUIDE[highlightedEngineName].url}</Text>
				</Text>
				<Text dimColor>{ENGINE_APPLY_GUIDE[highlightedEngineName].hint}</Text>
				<Text dimColor>Esc: exit</Text>
			</Box>
		);
	}

	if (step === 'done') {
		return (
			<Box flexDirection="column" padding={1} gap={1}>
				<Text>
					<Text color="cyanBright">qtr</Text> <Text dimColor>config setup</Text>
				</Text>
				<Box borderStyle="round" borderColor="green" paddingX={1}>
					<Text>
						Saved to <Text color="green">{savedPath}</Text>
					</Text>
				</Box>
				<Text dimColor>Press any key to exit, then run `qtr`.</Text>
			</Box>
		);
	}

	// step === 'fields'
	if (!engineName) {
		return (
			<Box flexDirection="column" padding={1}>
				<Text color="red">No engine selected.</Text>
			</Box>
		);
	}

	const fields = ENGINE_FIELDS[engineName];
	const current = fields[fieldIndex];
	const currentValue = values[current.key] ?? '';

	return (
		<Box flexDirection="column" padding={1} gap={1}>
			<Text>
				<Text color="cyanBright">qtr</Text> <Text dimColor>config setup</Text>
			</Text>

			<Box borderStyle="round" borderColor="yellow" paddingX={1} paddingY={0}>
				<Box flexDirection="column" width="100%" gap={1}>
					<Box justifyContent="space-between">
						<Text>
							Engine: <Text color="yellow">{engineName}</Text>{' '}
							<Text dimColor>(Esc to re-select)</Text>
						</Text>
						<Text dimColor>
							{fieldIndex + 1}/{fields.length}
						</Text>
					</Box>

					<Text dimColor>
						申请地址:{' '}
						<Text color="cyan">{ENGINE_APPLY_GUIDE[engineName].url}</Text>
					</Text>
					<Text dimColor>{ENGINE_APPLY_GUIDE[engineName].hint}</Text>

					<Box flexDirection="column">
						<Text>
							{current.label}{' '}
							{current.isRequired ? (
								<Text color="red">*</Text>
							) : (
								<Text dimColor>(optional)</Text>
							)}
						</Text>
						<Text dimColor>
							Current: {maskValue(currentValue, current.isSecret)}
						</Text>
						<TextInput
							value={currentValue}
							onChange={(next) => setValues((v) => ({...v, [current.key]: next}))}
							placeholder={current.placeholder}
						/>
						<Text dimColor>Enter: next / save</Text>
						{validationError && <Text color="red">{validationError}</Text>}
					</Box>
				</Box>
			</Box>

			{isSaving && <Text color="yellow">Saving…</Text>}
		</Box>
	);
}

function maskValue(value: string, isSecret?: boolean) {
	if (!value) return '(empty)';
	if (!isSecret) return value;
	return '*'.repeat(Math.min(value.length, 12));
}

function normalizeEngineValues(engineName: EngineName, values: Record<string, string>) {
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
