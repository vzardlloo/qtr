import React from 'react';
import {Box, Text, useInput} from 'ink';

export type TextInputProps = {
	value: string;
	onChange: (nextValue: string) => void;
	placeholder?: string;
	isDisabled?: boolean;
};

/**
 * Minimal single-line text input.
 *
 * This intentionally avoids external deps (like ink-text-input) to keep the tool
 * self-contained and easier to audit.
 */
export function TextInput({
	value,
	onChange,
	placeholder,
	isDisabled,
}: TextInputProps) {
	useInput((character, key) => {
		if (isDisabled) return;
		if (key.return || key.escape || key.tab) return;

		if (key.backspace || key.delete) {
			onChange(value.slice(0, -1));
			return;
		}

		if (key.ctrl || key.meta) return;

		// Filter out special keys.
		if (character) onChange(value + character);
	});

	return (
		<Box>
			<Text color="gray">› </Text>
			<Text>{value || <Text dimColor>{placeholder ?? ''}</Text>}</Text>
			<Text color="cyanBright">▍</Text>
		</Box>
	);
}
