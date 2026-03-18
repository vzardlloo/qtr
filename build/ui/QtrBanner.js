import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
const BANNER_LINES = [
    '   ____  __      ____',
    '  / __ \\/ /_  __/ __ \\\\',
    ' / / / / / / / / /_/ /',
    '/ /_/ / / /_/ / _, _/',
    '\\___\\_\\/_\\__,_/_/ |_|',
];
export function QtrBanner() {
    return (_jsx(Box, { flexDirection: "column", children: BANNER_LINES.map((line) => (_jsx(Text, { color: "cyanBright", children: line }, line))) }));
}
