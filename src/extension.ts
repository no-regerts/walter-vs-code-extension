import { ConfigManager } from './config-manager.js';
import { StaticAnalizer } from './core/static-analizer.js';
import { ExtensionController } from './extension-controller.js';

const configManager = new ConfigManager();
configManager.loadConfig();
const staticAnalizer = new StaticAnalizer();
const controller = new ExtensionController(configManager, staticAnalizer);
export const activate = controller.activate;
export const deactivate = controller.deactivate;
