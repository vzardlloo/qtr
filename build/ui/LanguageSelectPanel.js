import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function LanguageSelectPanel({ title, items, highlightedIndex, selectedCode, }) {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "magenta", paddingX: 1, paddingY: 0, children: [_jsxs(Text, { children: [title, ' ', _jsx(Text, { dimColor: true, children: "(\u2191/\u2193 move \u00B7 Enter confirm \u00B7 Esc/Tab close)" })] }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: items.map((item, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isSelected = item.code === selectedCode;
                    const prefix = isHighlighted ? '›' : ' ';
                    const suffix = isSelected ? ' *' : '';
                    const color = isHighlighted
                        ? 'magenta'
                        : isSelected
                            ? 'green'
                            : undefined;
                    return (_jsxs(Text, { color: color, children: [prefix, " ", item.code, ' ', _jsx(Text, { dimColor: true, children: item.label }), _jsx(Text, { dimColor: true, children: suffix })] }, item.code));
                }) })] }));
}
