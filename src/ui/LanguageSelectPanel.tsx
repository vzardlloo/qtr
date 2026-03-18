import React from 'react';
import {Box, Text} from 'ink';

export type LanguageItem = {
	code: string;
	label: string;
};

export type LanguageSelectPanelProps = {
	title: string;
	items: LanguageItem[];
	highlightedIndex: number;
	selectedCode: string;
};

export function LanguageSelectPanel({
	title,
	items,
	highlightedIndex,
	selectedCode,
}: LanguageSelectPanelProps) {
	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="magenta"
			paddingX={1}
			paddingY={0}
		>
			<Text>
				{title}{' '}
				<Text dimColor>(↑/↓ move · Enter confirm · Esc/Tab close)</Text>
			</Text>

			<Box flexDirection="column" marginTop={1}>
				{items.map((item, index) => {
					const isHighlighted = index === highlightedIndex;
					const isSelected = item.code === selectedCode;
					const prefix = isHighlighted ? '›' : ' ';
					const suffix = isSelected ? ' *' : '';
					const color = isHighlighted
						? 'magenta'
						: isSelected
							? 'green'
							: undefined;

					return (
						<Text key={item.code} color={color}>
							{prefix} {item.code}{' '}
							<Text dimColor>{item.label}</Text>
							<Text dimColor>{suffix}</Text>
						</Text>
					);
				})}
			</Box>
		</Box>
	);
}
