import { CompletionProvider } from './completion-provider.js';
import { ConfigManager } from './config-manager.js';
import { StaticAnalizer } from './core/static-analizer.js';
import { Parser } from './core/parser.js';
import { ExtensionController } from './extension-controller.js';
import { HoverProvider } from './hover-provider.js';
import { SelectionRangeProvider } from './selection-range-provider.js';

const configManager = new ConfigManager();
configManager.loadConfig();
const controller = new ExtensionController(
  configManager,
  new Parser(),
  new StaticAnalizer(),
  new HoverProvider(),
  new CompletionProvider(),
  new SelectionRangeProvider(),
);
export const activate = controller.activate;
export const deactivate = controller.deactivate;
