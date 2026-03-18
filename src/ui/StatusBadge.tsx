import React from 'react';
import {Box, Text} from 'ink';

export function StatusBadge({
	status,
}: {
	status: 'idle' | 'loading' | 'ok' | 'error';
}) {
	const {label, color} = (() => {
		switch (status) {
			case 'idle':
				return {label: 'idle', color: 'gray'} as const;
			case 'loading':
				return {label: 'loading', color: 'yellow'} as const;
			case 'ok':
				return {label: 'ok', color: 'green'} as const;
			case 'error':
				return {label: 'error', color: 'red'} as const;
		}
	})();

	return (
		<Box borderStyle="round" borderColor={color} paddingX={1}>
			<Text color={color}>{label}</Text>
		</Box>
	);
}
