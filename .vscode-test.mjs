import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'generated/test/**/*.test.js',
});
