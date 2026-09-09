// import esbuild from "esbuild";
// import process from "node:process";

// const config = {
//   entryPoints: ["src/extension.ts"],

//   bundle: true,

//   outfile: "out/src/extension.js",

//   external: ["vscode"],

//   format: "js",
//   platform: "node",
//   target: "node16",

//   // sourcemap: !production,

//   minify: true,

//   logLevel: "info",
// };

// async function main() {
//   if (false) {
//     const ctx = await esbuild.context(config);
//     await ctx.watch();

//     console.log("Watching...");
//   } else {
//     await esbuild.build(config);

//     console.log("Build complete");
//   }
// }

// main().catch(() => {
//   process.exit(1);
// });


import esbuild from "esbuild";
import process from "node:process";

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: ["extension.ts"],
  bundle: true,
  outfile: "generated/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node16",
  sourcemap: !production,
  minify: production,
  minifyIdentifiers: production,
  minifySyntax: production,
  minifyWhitespace: production,
  logLevel: "info",
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(config);
    await ctx.rebuild();
    await ctx.watch();
    console.log("⚡ Watch mode enabled... watching for changes");
  } else {
    await esbuild.build(config);
    console.log("🚀 Build complete");
  }
}

main().catch(err => {
  process.exit(1);
});