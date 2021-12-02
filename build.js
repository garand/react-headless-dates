const { build } = require("esbuild");
const package = require("./package.json");

const args = process.argv.slice(2);
const WATCH = args.includes("--watch");

const sharedBuildConfig = {
  entryPoints: ["src/useTemporal.ts"],
  bundle: true,
  sourcemap: process.env.NODE_ENV !== "production",
  minify: process.env.NODE_ENV === "production",
  target: ["esnext"],
  external: [
    ...Object.keys(package.dependencies ?? {}),
    ...Object.keys(package.peerDependencies ?? {}),
  ],
};

/**
 * CommonJS Build
 */
build({
  ...sharedBuildConfig,
  outdir: "dist/cjs",
  outExtension: {
    ".js": ".cjs",
  },
  format: "cjs",
  platform: "node",
  watch: WATCH && {
    onRebuild: () => {
      console.log("CJS build complete.");
    },
  },
}).catch(() => process.exit(1));

/**
 * ECMAScript Modules Build
 */
build({
  ...sharedBuildConfig,
  outdir: "dist/esm",
  splitting: true,
  outExtension: {
    ".js": ".mjs",
  },
  format: "esm",
  platform: "browser",
  watch: WATCH && {
    onRebuild: () => {
      console.log("ESM build complete");
    },
  },
}).catch(() => process.exit(1));
