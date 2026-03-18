import React from 'react';
import {Box, Text} from 'ink';
import type {EngineMeta, EngineName} from '../engines/types.js';

export type EngineSelectPanelProps = {
	engines: EngineMeta[];
	highlightedIndex: number;
	selectedEngine: EngineName;
};

export function EngineSelectPanel({
	engines,
	highlightedIndex,
	selectedEngine,
}: EngineSelectPanelProps) {
	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="yellow"
			paddingX={1}
			paddingY={0}
		>
			<Text>
				Choose engine{' '}
				<Text dimColor>
					(↑/↓ move · Enter confirm · Tab close · type first letter)
				</Text>
			</Text>

			<Box flexDirection="column" marginTop={1}>
				{engines.map((engine, index) => {
					const isHighlighted = index === highlightedIndex;
					const isSelected = engine.name === selectedEngine;
					const prefix = isHighlighted ? '›' : ' ';
					const suffix = isSelected ? ' *' : '';
					const color = isHighlighted
						? 'yellow'
						: isSelected
							? 'green'
							: undefined;

					return (
						<Text key={engine.name} color={color}>
							{prefix} {engine.name}
							<Text dimColor>{suffix ? suffix + ' ' : ' '}</Text>
							<Text dimColor>- {engine.description}</Text>
						</Text>
					);
				})}
			</Box>
		</Box>
	);
}
