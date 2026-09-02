import { ExtensionController } from './extension-controller.js';

const controller = new ExtensionController();
export const activate = controller.activate;
export const deactivate = controller.deactivate;
