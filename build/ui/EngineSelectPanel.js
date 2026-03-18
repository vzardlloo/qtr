import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function EngineSelectPanel({ engines, highlightedIndex, selectedEngine, }) {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 1, paddingY: 0, children: [_jsxs(Text, { children: ["Choose engine", ' ', _jsx(Text, { dimColor: true, children: "(\u2191/\u2193 move \u00B7 Enter confirm \u00B7 Tab close \u00B7 type first letter)" })] }), _jsx(Box, { flexDirection: "column", marginTop: 1, children: engines.map((engine, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isSelected = engine.name === selectedEngine;
                    const prefix = isHighlighted ? '›' : ' ';
                    const suffix = isSelected ? ' *' : '';
                    const color = isHighlighted
                        ? 'yellow'
                        : isSelected
                            ? 'green'
                            : undefined;
                    return (_jsxs(Text, { color: color, children: [prefix, " ", engine.name, _jsx(Text, { dimColor: true, children: suffix ? suffix + ' ' : ' ' }), _jsxs(Text, { dimColor: true, children: ["- ", engine.description] })] }, engine.name));
                }) })] }));
}
