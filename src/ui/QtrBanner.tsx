import React from 'react';
import {Box, Text} from 'ink';

const BANNER_LINES = [
	'   ____  __      ____',
	'  / __ \\/ /_  __/ __ \\\\',
	' / / / / / / / / /_/ /',
	'/ /_/ / / /_/ / _, _/',
	'\\___\\_\\/_\\__,_/_/ |_|',
];

export function QtrBanner() {
	return (
		<Box flexDirection="column">
			{BANNER_LINES.map((line) => (
				<Text key={line} color="cyanBright">
					{line}
				</Text>
			))}
		</Box>
	);
}
