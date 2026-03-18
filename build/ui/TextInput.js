import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text, useInput } from 'ink';
/**
 * Minimal single-line text input.
 *
 * This intentionally avoids external deps (like ink-text-input) to keep the tool
 * self-contained and easier to audit.
 */
export function TextInput({ value, onChange, placeholder, isDisabled, }) {
    useInput((character, key) => {
        if (isDisabled)
            return;
        if (key.return || key.escape || key.tab)
            return;
        if (key.backspace || key.delete) {
            onChange(value.slice(0, -1));
            return;
        }
        if (key.ctrl || key.meta)
            return;
        // Filter out special keys.
        if (character)
            onChange(value + character);
    });
    return (_jsxs(Box, { children: [_jsx(Text, { color: "gray", children: "\u203A " }), _jsx(Text, { children: value || _jsx(Text, { dimColor: true, children: placeholder ?? '' }) }), _jsx(Text, { color: "cyanBright", children: "\u258D" })] }));
}
