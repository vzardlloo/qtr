import React from 'react';
import {Box, Text} from 'ink';
import type {EngineName, TranslateResult} from '../engines/types.js';

export function ResultBox({
	engineName,
	status,
	result,
	errorMessage,
}: {
	engineName: EngineName;
	status: 'idle' | 'loading' | 'ok' | 'error';
	result?: TranslateResult;
	errorMessage?: string;
}) {
	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={status === 'error' ? 'red' : 'green'}
			paddingX={1}
			paddingY={0}
		>
			<Box>
				<Text>
					Result <Text dimColor>({engineName})</Text>
				</Text>
			</Box>

			<Box marginTop={1}>
				{status === 'idle' && <Text dimColor>Type something to translate.</Text>}
				{status === 'loading' && <Text color="yellow">Translating…</Text>}
				{status === 'error' && (
					<Text color="red">{errorMessage ?? 'Unknown error'}</Text>
				)}
				{status === 'ok' && result && (
					<Box flexDirection="column" gap={1}>
						<Text>{result.text}</Text>
						{Boolean(result.raw) && (
							<Text dimColor>
								raw: {JSON.stringify(result.raw).slice(0, 200)}
							</Text>
						)}
					</Box>
				)}
			</Box>
		</Box>
	);
}
