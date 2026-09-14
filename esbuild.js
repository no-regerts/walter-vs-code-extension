import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';

const isDev = process.argv.includes('--dev');
const isProd = process.argv.includes('--prod');

const vscodeProblemMatcherPlugin = {
  name: 'vscode-problem-matcher',
  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      console.log('[watch] build finished');
    });
  },
};

async function run() {
  try {
    const config = {
      entryPoints: ['src/extension.ts'],
      outfile: 'generated/src/extension.js',
      external: ['vscode'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      sourcemap: isDev,
      minify: isProd,

      // Needed to befriend esbuild and VS Code problem matcher:
      plugins: isDev && [vscodeProblemMatcherPlugin],

      // Nedeed to properly bundle web-tree-sitter:
      banner: {
        js: [
          `import { createRequire as topLevelCreateRequire } from 'module';`,
          `const require = topLevelCreateRequire(import.meta.url);`,
        ].join('\n'),
      },
      plugins: [
        copy({
          assets: {
            from: ['./node_modules/web-tree-sitter/web-tree-sitter.wasm'],
            to: ['.'],
          },
        }),
      ],
    };

    if (isProd) {
      await esbuild.build(config);
      console.log('Production build complete!');
    } else {
      const ctx = await esbuild.context(config);
      await ctx.watch();
      console.log('[watch] build finished');
    }
  } catch (error) {
    if (isProd) process.exit(1);
  }
}

run();
