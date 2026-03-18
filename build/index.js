#!/usr/bin/env node
import { jsx as _jsx } from "react/jsx-runtime";
import { render } from 'ink';
import { cac } from 'cac';
import { TranslatorApp } from './ui/TranslatorApp.js';
import { ConfigSetupApp } from './ui/ConfigSetupApp.js';
import { createEngine, listEngines } from './engines/index.js';
import { isEngineName } from './engines/types.js';
import { getPreferredConfigPath, hasAnyEngineConfigured, initConfigIfMissing, loadConfig, setCurrentEngine, } from './config/config.js';
const cli = cac('qtr');
cli
    .command('', 'Start interactive qtr')
    .option('--engine <name>', 'Use a specific engine for this session')
    .option('--from <lang>', 'Source language, e.g. en/zh/auto', { default: 'auto' })
    .option('--to <lang>', 'Target language, e.g. zh/en', { default: 'zh' })
    .action(async (options) => {
    await initConfigIfMissing();
    const config = await loadConfig();
    // No engine configured at all -> guide users into setup.
    if (!hasAnyEngineConfigured(config)) {
        render(_jsx(ConfigSetupApp, { initialEngine: options.engine }));
        return;
    }
    render(_jsx(TranslatorApp, { initialEngine: options.engine, defaultFrom: options.from, defaultTo: options.to }));
});
cli
    .command('translate <text>', 'Translate once and print result')
    .option('--engine <name>', 'Use a specific engine for this command')
    .option('--from <lang>', 'Source language, e.g. en/zh/auto', { default: 'auto' })
    .option('--to <lang>', 'Target language, e.g. zh/en', { default: 'zh' })
    .action(async (text, options) => {
    await initConfigIfMissing();
    const config = await loadConfig();
    if (!hasAnyEngineConfigured(config)) {
        throw new Error('未检测到任何可用翻译引擎配置，请先运行 `qtr config:setup` 设置一个引擎。');
    }
    const engineName = options.engine ?? config.currentEngine;
    if (!isEngineName(engineName)) {
        throw new Error(`Unknown engine: ${engineName}`);
    }
    const engine = await createEngine(engineName);
    const result = await engine.translate({
        text,
        from: options.from,
        to: options.to,
    });
    // eslint-disable-next-line no-console
    console.log(result.text);
});
cli
    .command('engines', 'List supported engines')
    .action(() => {
    for (const engine of listEngines()) {
        // eslint-disable-next-line no-console
        console.log(`${engine.name}\t${engine.description}`);
    }
});
cli
    .command('config:init', 'Create ~/.qtr-config.json if missing')
    .action(async () => {
    await initConfigIfMissing({ force: true });
    // eslint-disable-next-line no-console
    console.log(`Config initialized: ${getPreferredConfigPath()}`);
});
cli
    .command('config:engine <name>', 'Set default engine in config')
    .action(async (name) => {
    await initConfigIfMissing();
    await setCurrentEngine(name);
    // eslint-disable-next-line no-console
    console.log(`Default engine set to: ${name}`);
});
cli
    .command('config:setup', 'Interactive setup for engine credentials')
    .option('--engine <name>', 'Engine name: baidu/youdao/tencent')
    .action(async (options) => {
    await initConfigIfMissing();
    render(_jsx(ConfigSetupApp, { initialEngine: options.engine }));
});
cli.help();
cli.parse();
