import { build, BuildOptions } from "esbuild";
import { delimiter } from "path";
import Logger from "pino";
import { argv, env, exit, stdin, stdout } from "process";
import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { VERSION } from "./config";

enum SourceMapOptions {
  INLINE = "inline",
  EXTERNAL = "external",
  BOTH = "both",
  LINKED = "linked",
}

enum LegalComments {
  NONE = "none",
  INLINE = "inline",
  EOF = "eof",
  LINKED = "linked",
  EXTERNAL = "external",
}

enum Format {
  LIFE = "life",
  CJS = "cjs",
  ESM = "esm",
}

enum JSX {
  TRANSFORM = "transform",
  PRESERVE = "preserve",
}

enum LogLevel {
  VERBOSE = "verbose",
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SILENT = "silent",
}

const logger = Logger();

const parseCLIArguments = (parser: Argv) =>
  parser
    .usage("Usage: esbuild [options] [entry points]")
    .option("bundle", {
      boolean: true,
      desc: "Bundle all dependencies into the output files",
      group: "Simple options",
    })
    .option("define", {
      array: true,
      desc: "Substitute K with V while parsing",
      group: "Simple options",
    })
    .option("external", {
      array: true,
      desc: "Exclude module M from the bundle (can use * wildcards)",
      group: "Simple options",
    })
    .option("format", {
      string: true,
      choices: [Format.LIFE, Format.CJS, Format.ESM],
      desc: "Output format (iife | cjs | esm, no default when not bundling, otherwise default is iife when platform is browser and cjs when platform is node)",
      group: "Simple options",
    })
    .option("loader", {
      array: true,
      desc: "Use loader L to load file extension X, where L is one of: js | jsx | ts | tsx | css | json | text | base64 | file | dataurl | binary",
      group: "Simple options",
    })
    .option("minify", {
      boolean: true,
      desc: "Minify the output (sets all --minify-* flags)",
      group: "Simple options",
    })
    .option("outdir", {
      string: true,
      desc: "The output directory (for multiple entry points)",
      group: "Simple options",
    })
    .option("outfile", {
      string: true,
      desc: "The output file (for one entry point)",
      group: "Simple options",
    })
    .option("platform", {
      string: true,
      desc: " Platform target (browser | node | neutral, default browser)",
      group: "Simple options",
    })
    .option("serve", {
      string: true,
      desc: "Start a local HTTP server on this host:port for outputs",
      group: "Simple options",
    })
    .option("sourcemap", {
      boolean: true,
      desc: "Emit a source map",
      group: "Simple options",
    })
    .option("splitting", {
      boolean: true,
      desc: "Enable code splitting (currently only for esm)",
      group: "Simple options",
    })
    .option("target", {
      string: true,
      desc: "Environment target (e.g. es2017, chrome58, firefox57, safari11, edge16, node10, default esnext)",
      group: "Simple options",
    })
    .option("watch", {
      boolean: true,
      desc: "Watch mode: rebuild on file system changes",
      group: "Simple options",
    })
    .option("allow-overwrite", {
      boolean: true,
      desc: "Allow output files to overwrite input files",
      group: "Advanced options",
    })
    .option("analyze", {
      string: true,
      desc: 'Print a report about the contents of the bundle (use "--analyze=verbose" for a detailed report)',
      group: "Advanced options",
    })
    .option("asset-names", {
      string: true,
      desc: 'Path template to use for "file" loader files (default "[name]-[hash]")',
      group: "Advanced options",
    })
    .option("banner", {
      string: true,
      desc: "Text to be prepended to each output file of type T where T is one of: css | js",
      group: "Advanced options",
    })
    .option("charset", {
      string: true,
      desc: "Do not escape UTF-8 code points",
      group: "Advanced options",
      default: "UTF-8",
    })
    .option("chunk-names", {
      string: true,
      desc: 'Path template to use for code splitting chunks (default "[name]-[hash]")',
      group: "Advanced options",
    })
    .option("color", {
      boolean: true,
      desc: "Force use of color terminal escapes",
      group: "Advanced options",
    })
    .option("drop", {
      array: true,
      desc: "Remove certain constructs (console | debugger)",
      group: "Advanced options",
    })
    .option("entry-name", {
      string: true,
      desc: 'Path template to use for entry point output paths (default "[dir]/[name]", can also use "[hash]")',
      group: "Advanced options",
    })
    .option("footer", {
      array: true,
      desc: "Text to be appended to each output file of type T where T is one of: css | js",
      group: "Advanced options",
    })
    .option("global-name", {
      string: true,
      desc: "The name of the global for the IIFE format",
      group: "Advanced options",
    })
    .option("ignore-annotations", {
      boolean: true,
      desc: "Enable this to work with packages that have incorrect tree-shaking annotations",
      group: "Advanced options",
    })
    .option("inject", {
      array: true,
      desc: "Import the file F into all input files and automatically replace matching globals with imports",
      group: "Advanced options",
    })
    .option("jsx-factory", {
      string: true,
      desc: "What to use for JSX instead of React.createElement",
      group: "Advanced options",
    })
    .option("jsx-fragment", {
      string: true,
      desc: "What to use for JSX instead of React.Fragment",
      group: "Advanced options",
    })
    .option("jsx", {
      string: true,
      choices: [JSX.TRANSFORM, JSX.PRESERVE],
      desc: 'Set to "preserve" to disable transforming JSX to JS',
      group: "Advanced options",
    })
    .option("keep-names", {
      boolean: true,
      desc: 'Preserve "name" on functions and classes',
      group: "Advanced options",
    })
    .option("legal-comments", {
      string: true,
      choices: [
        LegalComments.NONE,
        LegalComments.INLINE,
        LegalComments.EOF,
        LegalComments.LINKED,
        LegalComments.EXTERNAL,
      ],
      desc: "Where to place legal comments (none | inline | eof | linked | external, default eof when bundling and inline otherwise)",
      group: "Advanced options",
    })
    .option("log-level", {
      string: true,
      choices: [
        LogLevel.VERBOSE,
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARNING,
        LogLevel.ERROR,
        LogLevel.SILENT,
      ],
      default: LogLevel.INFO,
      desc: "Disable logging (verbose | debug | info | warning | error | silent, default info)",
      group: "Advanced options",
    })
    .option("log-limit", {
      number: true,
      desc: "Maximum message count or 0 to disable (default 6)",
      default: 6,
      group: "Advanced options",
    })
    .option("main-fields", {
      array: true,
      desc: 'Override the main file order in package.json (default "browser,module,main" when platform is browser and "main,module" when platform is node)',
      group: "Advanced options",
    })
    .option("metafile", {
      string: true,
      desc: "Write metadata about the build to a JSON file",
      group: "Advanced options",
    })
    .option("minify-whitespace", {
      boolean: true,
      desc: "Remove whitespace in output files",
      group: "Advanced options",
    })
    .option("minify-identifiers", {
      boolean: true,
      desc: "Shorten identifiers in output files",
      group: "Advanced options",
    })
    .option("minify-syntax", {
      boolean: true,
      desc: "Use equivalent but shorter syntax in output files",
      group: "Advanced options",
    })
    .option("out-extension", {
      array: true,
      desc: 'Use a custom output extension instead of ".js"',
      group: "Advanced options",
    })
    .option("outbase", {
      string: true,
      desc: "The base path used to determine entry point output paths (for multiple entry points)",
      group: "Advanced options",
    })
    .option("preserve-symlinks", {
      boolean: true,
      desc: "Disable symlink resolution for module lookup",
      group: "Advanced options",
    })
    .option("public-path", {
      string: true,
      desc: 'Set the base URL for the "file" loader',
      group: "Advanced options",
    })
    .option("pure", {
      array: true,
      desc: "Mark the name N as a pure function for tree shaking",
      group: "Advanced options",
    })
    .option("resolve-extensions", {
      array: true,
      default: [".tsx", ".ts", ".jsx", ".js", ".css", ".json"],
      desc: 'A comma-separated list of implicit extensions (default ".tsx,.ts,.jsx,.js,.css,.json")',
      group: "Advanced options",
    })
    .option("serve-dir", {
      string: true,
      desc: "What to serve in addition to generated output files",
      group: "Advanced options",
    })
    .option("source-root", {
      string: true,
      desc: ' Sets the "sourceRoot" field in generated source maps',
      group: "Advanced options",
    })
    .option("sourcefile", {
      string: true,
      desc: "Set the source file for the source map (for stdin)",
      group: "Advanced options",
    })
    .option("sourcemap", {
      string: true,
      choices: [SourceMapOptions.EXTERNAL],
      desc: "Do not link to the source map with a comment",
      group: "Advanced options",
    })
    .option("sourcemap", {
      string: true,
      choices: [SourceMapOptions.INLINE],
      desc: "Emit the source map with an inline data URL",
      group: "Advanced options",
    })
    .option("sources-content", {
      boolean: true,
      default: false,
      desc: 'Omit "sourcesContent" in generated source maps',
      group: "Advanced options",
    })
    .option("tree-shaking", {
      boolean: true,
      desc: "Force tree shaking on or off (false | true)",
      group: "Advanced options",
    })
    .option("tsconfig", {
      string: true,
      desc: "Use this tsconfig.json file instead of other ones",
      group: "Advanced options",
    })
    .option("version", {
      boolean: true,
      desc: "Print the current version and exit",
      group: "Advanced options",
    })
    .option("heap", {
      string: true,
      hidden: true,
    })
    .option("trace", {
      string: true,
      hidden: true,
    })
    .option("timing", {
      boolean: true,
      hidden: true,
    })
    .option("cpuprofile", {
      string: true,
      hidden: true,
    })
    .option("service", {
      string: true,
      hidden: true,
    })
    .option("ping", {
      boolean: true,
      hidden: true,
    })
    .option("servedir", {
      string: true,
      hidden: true,
    })
    .example([
      [
        "$0 --bundle entry_point.js --outdir=dist --minify --sourcemap",
        "# Produces dist/entry_point.js and dist/entry_point.js.map",
      ],
      [
        "$0 --bundle entry_point.js --outfile=out.js --loader:.js=jsx",
        "# Allow JSX syntax in .js files",
      ],
      [
        "$0 example.js --outfile=out.js --define:RELEASE=true",
        "# Substitute the identifier RELEASE for the literal true",
      ],
      [
        "$0 --minify --loader=ts < input.ts > output.js",
        "# Provide input via stdin, get output via stdout",
      ],
      [
        "$0 app.ts --bundle --watch",
        "# Automatically rebuild when input files are changed",
      ],
      [
        "$0 app.ts --bundle --servedir=www --outdir=www/js",
        '# Start a local HTTP server for everything in "www"',
      ],
    ])
    .version(VERSION)
    .demandCommand(1, "")
    .recommendCommands()
    .help()
    .alias("h", "help")
    .alias("v", "version")
    .parseSync();

interface Options {
  service?: string;
  ping?: boolean;
  verbose?: boolean;
  serve?: string;
  analyze?: string;
  watch?: boolean;
  logLevel?: LogLevel;
  servedir?: string;
}

const runService = async (sendPings = false) => {
  if (sendPings) logger.level = "info";
};

const Run = async (options: Options): Promise<number> => {
  const buildOptions: BuildOptions = options;

  if (env.NODE_PATH) buildOptions.nodePaths = env.NODE_PATH.split(delimiter);

  await build(buildOptions);
  return 0;
};

const setLogLevel = async (options: Options) => {
  if (options.logLevel) {
    logger.level = options.logLevel;
  } else {
    logger.level = LogLevel.SILENT;
  }

  if (options.verbose) logger.level = LogLevel.DEBUG;
};

const initCLI = async () => {
  // TODO Global line
  const options: Options = parseCLIArguments(yargs(hideBin(argv)));
  await setLogLevel(options);

  if (options.service) {
    if (options.service !== VERSION) {
      logger.error(
        `Cannot start service: Host version ${options.service} does not match binary version ${VERSION}`
      );
      exit(1);
    }
    await runService(options.ping);
  }

  let exitCode = 1;

  const callbacks: Array<() => Promise<void>> = [];

  let isServeOrWatch = false;

  if (options.serve || options.watch) isServeOrWatch = true;

  if (isServeOrWatch && !stdin.isTTY) {
    stdin.on("readable", () => {
      stdin.read();
    });

    stdin.on("SIGINT", () => {
      exit(1);
    });

    stdin.on("end", () => {
      exit(0);
    });
  }

  exitCode = await Run(options);

  await Promise.all(
    callbacks.map(async (callback) => {
      await callback();
    })
  );

  exit(exitCode);
};

export { initCLI, parseCLIArguments };
