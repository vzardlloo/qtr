import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function StatusBadge({ status, }) {
    const { label, color } = (() => {
        switch (status) {
            case 'idle':
                return { label: 'idle', color: 'gray' };
            case 'loading':
                return { label: 'loading', color: 'yellow' };
            case 'ok':
                return { label: 'ok', color: 'green' };
            case 'error':
                return { label: 'error', color: 'red' };
        }
    })();
    return (_jsx(Box, { borderStyle: "round", borderColor: color, paddingX: 1, children: _jsx(Text, { color: color, children: label }) }));
}
