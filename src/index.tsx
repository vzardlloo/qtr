#!/usr/bin/env node

import React from 'react';
import {render} from 'ink';
import {cac} from 'cac';
import {TranslatorApp} from './ui/TranslatorApp.js';
import {createEngine, listEngines} from './engines/index.js';
import {isEngineName} from './engines/types.js';
import {
	getPreferredConfigPath,
	initConfigIfMissing,
	loadConfig,
	setCurrentEngine,
} from './config/config.js';

const cli = cac('qtr');

cli
	.command('', 'Start interactive qtr')
	.option('--engine <name>', 'Use a specific engine for this session')
	.option('--from <lang>', 'Source language, e.g. en/zh/auto', {default: 'auto'})
	.option('--to <lang>', 'Target language, e.g. zh/en', {default: 'zh'})
	.action(async (options) => {
		await initConfigIfMissing();

		render(
			<TranslatorApp
				initialEngine={options.engine}
				defaultFrom={options.from}
				defaultTo={options.to}
			/>,
		);
	});

cli
	.command('translate <text>', 'Translate once and print result')
	.option('--engine <name>', 'Use a specific engine for this command')
	.option('--from <lang>', 'Source language, e.g. en/zh/auto', {default: 'auto'})
	.option('--to <lang>', 'Target language, e.g. zh/en', {default: 'zh'})
	.action(async (text: string, options) => {
		await initConfigIfMissing();
		const config = await loadConfig();
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
		await initConfigIfMissing({force: true});
		// eslint-disable-next-line no-console
		console.log(`Config initialized: ${getPreferredConfigPath()}`);
	});

cli
	.command('config:engine <name>', 'Set default engine in config')
	.action(async (name: string) => {
		await initConfigIfMissing();
		await setCurrentEngine(name);
		// eslint-disable-next-line no-console
		console.log(`Default engine set to: ${name}`);
	});

cli.help();
cli.parse();
