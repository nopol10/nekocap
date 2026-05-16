/**
 * Build orchestrator for the NekoCap browser extension.
 * Runs multiple Vite builds sequentially to produce self-contained bundles
 * for each extension entry point (background, content, popup, canvas-iframe).
 *
 * Usage:
 *   tsx build-extension.ts [--mode=production|development] [--target=chrome|firefox] [--watch]
 */
import react from "@vitejs/plugin-react-swc";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import type { RollupWatcher } from "rollup";
import license from "rollup-plugin-license";
import { fileURLToPath } from "url";
import { build, loadEnv, type InlineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// @ts-ignore
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD_ENV_MODE = "prod";
// ──────────────────────────────────────────────────────────────
// CLI argument parsing
// ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : undefined;
}

const mode = (getArg("mode") || PROD_ENV_MODE) as
  | typeof PROD_ENV_MODE
  | "development";
const targetBrowser = (getArg("target") || "chrome") as "chrome" | "firefox";
const watchMode = args.includes("--watch");
const devMode = mode !== PROD_ENV_MODE;
const isChrome = targetBrowser === "chrome";

// ──────────────────────────────────────────────────────────────
// Entry point definitions
// ──────────────────────────────────────────────────────────────
interface EntryDefinition {
  input: string;
  outputName: string;
}

const ENTRIES: Record<string, EntryDefinition> = {
  background: {
    input: "src/extension/background/index.tsx",
    outputName: "js/background",
  },
  content: {
    input: "src/extension/content/index.tsx",
    outputName: "js/content",
  },
  popup: {
    input: "src/extension/popup/index.tsx",
    outputName: "js/popup",
  },
  "canvas-iframe": {
    input: "src/extension/content/canvas-iframe/index.tsx",
    outputName: "js/canvas-iframe",
  },
};

// ──────────────────────────────────────────────────────────────
// Environment variable handling
// ──────────────────────────────────────────────────────────────
function getEnvDefines(): Record<string, string> {
  const env = loadEnv(mode, process.cwd(), "NEXT_");
  const defines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    // Skip keys with invalid identifier characters (e.g. comments from .env)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      defines[`process.env.${key}`] = JSON.stringify(value);
    }
  }
  return defines;
}

// ──────────────────────────────────────────────────────────────
// Manifest modification for production Chrome builds
// ──────────────────────────────────────────────────────────────
function updateManifest(
  manifestPath: string,
  envDefines: Record<string, string>,
): string {
  const originalManifestString = fs.readFileSync(manifestPath, "utf-8");
  const manifest = JSON.parse(originalManifestString);

  const extensionKey = JSON.parse(
    envDefines["process.env.EXTENSION_KEY"] || '""',
  );
  if (extensionKey) {
    manifest.key = extensionKey;
  }

  if (manifest.externally_connectable?.matches) {
    manifest.externally_connectable.matches =
      manifest.externally_connectable.matches.filter(
        (match: string) => !match.includes("localhost"),
      );
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, undefined, 2));
  return originalManifestString;
}

// ──────────────────────────────────────────────────────────────
// Extension static asset copy (manifest, locales, icons, HTML, subtitle-octopus)
// Extracted so watch mode can run it once at startup instead of on every rebuild.
// ──────────────────────────────────────────────────────────────
function copyExtensionStatics() {
  const outDir = path.resolve(__dirname, "dist", "extension");
  fs.mkdirSync(outDir, { recursive: true });

  const copyFile = (src: string, dest: string) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  };
  const copyDir = (src: string, dest: string) => {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  // _locales
  copyDir(
    path.resolve(__dirname, "extension-statics", "_locales"),
    path.join(outDir, "_locales"),
  );

  // Icons
  for (const file of fs.readdirSync(
    path.resolve(__dirname, "extension-statics"),
  )) {
    if (file.endsWith(".png")) {
      copyFile(
        path.resolve(__dirname, "extension-statics", file),
        path.join(outDir, file),
      );
    }
  }

  // Manifest
  copyFile(
    path.resolve(
      __dirname,
      "extension-statics",
      `manifest-${targetBrowser}.json`,
    ),
    path.join(outDir, "manifest.json"),
  );

  // HTML
  copyFile(
    path.resolve(__dirname, "src", "extension", "popup", "popup.html"),
    path.join(outDir, "popup.html"),
  );
  copyFile(
    path.resolve(
      __dirname,
      "src",
      "extension",
      "background",
      "background.html",
    ),
    path.join(outDir, "background.html"),
  );
  copyFile(
    path.resolve(
      __dirname,
      "src",
      "extension",
      "content",
      "canvas-iframe",
      "index.html",
    ),
    path.join(outDir, "canvas-iframe.html"),
  );

  // subtitle-octopus js/wasm/data
  const octopusDir = path.resolve(__dirname, "src", "libs", "subtitle-octopus");
  const octopusOutDir = path.join(outDir, "js", "subtitle-octopus");
  fs.mkdirSync(octopusOutDir, { recursive: true });
  for (const file of fs.readdirSync(octopusDir)) {
    if (
      file.endsWith(".js") ||
      file.endsWith(".wasm") ||
      file.endsWith(".data") ||
      file.endsWith(".mem") ||
      file === "COPYRIGHT"
    ) {
      copyFile(path.join(octopusDir, file), path.join(octopusOutDir, file));
    }
  }

  // subtitle-octopus assets
  const assetsDir = path.join(octopusDir, "assets");
  const assetsOutDir = path.join(outDir, "sub-assets");
  fs.mkdirSync(assetsOutDir, { recursive: true });
  for (const file of fs.readdirSync(assetsDir)) {
    copyFile(path.join(assetsDir, file), path.join(assetsOutDir, file));
  }
}

// ──────────────────────────────────────────────────────────────
// Watch-mode reload sentinel: writing this file signals the background SW
// (which polls it) to call chrome.runtime.reload().
// ──────────────────────────────────────────────────────────────
function writeReloadSentinel() {
  const outDir = path.resolve(__dirname, "dist", "extension");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, ".reload"), Date.now().toString());
}

// ──────────────────────────────────────────────────────────────
// Vite config factory
// ──────────────────────────────────────────────────────────────
interface ConfigOptions {
  emptyOutDir: boolean;
  copyStatics: boolean;
  includeLicense: boolean;
}

function createConfig(
  entry: string,
  { emptyOutDir, copyStatics, includeLicense }: ConfigOptions,
): InlineConfig {
  const entryDef = ENTRIES[entry];
  const envDefines = getEnvDefines();

  const plugins: any[] = [
    react(),
    svgr(),
    {
      name: "ensure-css-files",
      writeBundle() {
        const outDir = path.resolve(__dirname, "dist", "extension");
        const targetCss = path.join(outDir, `${entryDef.outputName}.css`);
        if (!fs.existsSync(targetCss) && entry !== "background") {
          fs.writeFileSync(targetCss, "");
        }
      },
    },
  ];

  if (copyStatics) {
    plugins.push({
      name: "copy-extension-statics",
      closeBundle() {
        copyExtensionStatics();
        console.log("  📋 Copied extension static files");
      },
    });
  }

  if (includeLicense) {
    plugins.push(
      license({
        thirdParty: {
          output: path.resolve(
            __dirname,
            "dist",
            "extension",
            "oss-licenses.txt",
          ),
          includePrivate: false,
        },
      }),
    );
  }

  return {
    configFile: false,
    plugins,
    esbuild: {
      // Equivalent to terser's ascii_only: true
      charset: "ascii",
    },
    define: {
      ...envDefines,
      "process.env.NODE_ENV": JSON.stringify(
        devMode ? "development" : "production",
      ),
      global: "globalThis",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "next-i18next": "react-i18next",
      },
      extensions: [".ts", ".tsx", ".js", ".scss", ".css"],
    },
    publicDir: false,
    css: {
      modules: false,
    },
    build: {
      cssCodeSplit: false,
      outDir: path.resolve(__dirname, "dist", "extension"),
      emptyOutDir,
      minify: !devMode,
      // gzip-size reporting on a 5MB+ IIFE is purely cosmetic and noticeably
      // slow on every rebuild; skip in watch (and dev one-shots).
      reportCompressedSize: !devMode,
      chunkSizeWarningLimit: devMode ? Infinity : 500,
      // esbuild charset: 'ascii' is equivalent to terser's ascii_only option
      // (important for CJK content in the extension)
      ...(devMode
        ? {}
        : {
            target: "es2020",
          }),
      // Inline sourcemaps balloon the IIFE output and slow every rewrite in
      // watch mode. Disable in watch (rebuild speed wins), keep for one-shot
      // dev builds, none in prod.
      modulePreload: false,
      sourcemap: devMode && !watchMode ? "inline" : false,
      rollupOptions: {
        input: {
          [entryDef.outputName]: path.resolve(__dirname, entryDef.input),
        },
        output: {
          format: "iife",
          entryFileNames: "[name].js",
          // Force single file bundle for the extension entry (prevents chunking from dynamic imports)
          inlineDynamicImports: true,
          // esbuild's minifier emits `__name(fn, "originalName")` calls to
          // preserve function/class `.name` after renaming, but in IIFE output
          // (non-lib build) the matching helper definition gets dropped. Define
          // it ourselves so the reference resolves at runtime. This is what
          // shows up in Firefox as `ReferenceError: __name is not defined`.
          banner:
            'var __name=(t,v)=>Object.defineProperty(t,"name",{value:v,configurable:true});',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || assetInfo.names?.[0] || "";
            if (name.endsWith(".css")) {
              return `${entryDef.outputName}.[ext]`;
            }
            return "img/[name].[ext]";
          },
        },
        treeshake: {
          moduleSideEffects: true,
        },
      },
      ...(watchMode ? { watch: {} } : {}),
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Main build execution
// ──────────────────────────────────────────────────────────────
async function runWatch(entries: string[]) {
  const outDir = path.resolve(__dirname, "dist", "extension");

  // Clear dist once up front, then never empty during parallel builds (each
  // build with emptyOutDir: true would race against the others' outputs).
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  // Copy statics once at startup. Source files don't change during a watch
  // session — re-copying _locales/icons/subtitle-octopus on every rebuild is
  // pure overhead.
  copyExtensionStatics();
  console.log("📋 Copied extension static files");

  // pendingBuilds starts pre-populated so the sentinel isn't written between
  // watcher setup and the first START events (initial state = "still building").
  const pendingBuilds = new Set<string>(entries);
  let sentinelDebounce: NodeJS.Timeout | null = null;
  let firstCycleDone = false;
  let errored = false;

  const scheduleSentinel = () => {
    if (sentinelDebounce) clearTimeout(sentinelDebounce);
    sentinelDebounce = setTimeout(() => {
      if (pendingBuilds.size === 0 && !errored) {
        writeReloadSentinel();
        if (!firstCycleDone) {
          firstCycleDone = true;
          console.log(
            `\n✅ Initial watch build complete. Auto-reload active.\n`,
          );
        } else {
          console.log(`🔁 Rebuild emitted — signaling extension auto-reload`);
        }
      }
      errored = false;
    }, 200);
  };

  console.log(
    `\n📦 Starting ${entries.length} parallel watchers: ${entries.join(
      ", ",
    )}\n`,
  );

  const watchers = (await Promise.all(
    entries.map((entry) =>
      build(
        createConfig(entry, {
          emptyOutDir: false,
          copyStatics: false,
          includeLicense: false,
        }),
      ),
    ),
  )) as unknown as RollupWatcher[];

  watchers.forEach((watcher, idx) => {
    const entryName = entries[idx];
    watcher.on("event", (event) => {
      if (event.code === "START") {
        pendingBuilds.add(entryName);
      } else if (event.code === "END") {
        pendingBuilds.delete(entryName);
        scheduleSentinel();
      } else if (event.code === "ERROR") {
        pendingBuilds.delete(entryName);
        errored = true;
        console.error(`❌ ${entryName}:`, event.error);
      }
    });
  });

  // Resolves never — watchers keep the process alive.
  return new Promise<void>(() => {
    // intentional no-op
  });
}

async function runOneShot(entries: string[]) {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const isFirst = i === 0;
    const isLast = i === entries.length - 1;

    console.log(`\n📦 Building entry: ${entry} (${i + 1}/${entries.length})\n`);

    const config = createConfig(entry, {
      emptyOutDir: isFirst,
      copyStatics: isLast,
      includeLicense: !devMode && isLast,
    });

    await build(config);
  }

  // Post-build: zip for production
  if (!devMode) {
    console.log(`\n📁 Zipping extension...\n`);
    execSync(`node zip-extension.js --target=${targetBrowser}`, {
      stdio: "inherit",
    });
  }
}

async function main() {
  console.log(
    `\n🔨 Building extension: mode=${mode}, target=${targetBrowser}, watch=${watchMode}\n`,
  );

  const entries = Object.keys(ENTRIES);
  const envDefines = getEnvDefines();

  // For production Chrome builds, modify the manifest before building
  let originalManifestString = "";
  const manifestPath = path.join(
    __dirname,
    "extension-statics",
    `manifest-${targetBrowser}.json`,
  );

  if (!devMode && isChrome) {
    originalManifestString = updateManifest(manifestPath, envDefines);
  }

  try {
    if (watchMode) {
      await runWatch(entries);
    } else {
      await runOneShot(entries);
    }
  } finally {
    if (originalManifestString) {
      fs.writeFileSync(manifestPath, originalManifestString);
      console.log(`\n✅ Restored original manifest\n`);
    }
  }

  console.log(`\n✅ Extension build complete!\n`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
