import type {
  Charset,
  Drop,
  Format,
  Loader,
  LogLevel,
  Platform,
} from "esbuild";
import { build, BuildOptions, version } from "esbuild";
import { delimiter } from "path";
import Logger from "pino";
import { argv, env, exit, stdin } from "process";
import type { ArgumentsCamelCase } from "yargs";
import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { VERSION } from "./config.js";
import type { JSX, LegalComments, MapType } from "./types.js";
import {
  CharsetOptions,
  DropOptions,
  ExtendedBuildOptions,
  FormatOptions,
  JsxOptions,
  LegalCommentOptions,
  LoaderOptions,
  LogLevelOptions,
  PlatformOptions,
  SourceMapOptions,
} from "./types.js";

const logger = Logger();

const parseCLIArguments = async (parser: Argv) =>
  parser
    .option("bundle", {
      boolean: true,
      desc: "Bundle all dependencies into the output files",
      group: "Simple options",
    })
    .option("define", {
      array: true,
      string: true,
      desc: "Substitute K with V while parsing",
      group: "Simple options",
    })
    .coerce("define", (values: string[]) =>
      values.reduce((defines, current) => {
        const [identifier, expression] = current.split("=");

        if (!expression) throw new Error(`Invalid define: ${current}`);
        return {
          ...defines,
          [identifier]: expression,
        };
      }, {} as MapType)
    )
    .option("external", {
      string: true,
      array: true,
      desc: "Exclude module M from the bundle (can use * wildcards)",
      group: "Simple options",
    })
    .option("format", {
      string: true,
      choices: [FormatOptions.LIFE, FormatOptions.CJS, FormatOptions.ESM],
      coerce: (value): Format => value,
      desc: "Output format (iife | cjs | esm, no default when not bundling, otherwise default is iife when platform is browser and cjs when platform is node)",
      group: "Simple options",
    })
    .option("loader", {
      array: true,
      string: true,
      desc: "Use loader L to load file extension X, where L is one of: js | jsx | ts | tsx | css | json | text | base64 | file | dataurl | binary",
      group: "Simple options",
    })
    .coerce(
      "loader",
      (values: string[]): MapType<Loader> =>
        values.reduce((loader, current) => {
          const [ext, type] = current.split(":");

          if (!type) throw new Error(`Invalid loader: ${current}`);

          if (!Object.values<string>(LoaderOptions).includes(type))
            throw new Error(
              `Invalid loader type: ${type} for extension: ${ext}`
            );
          return {
            ...loader,
            [ext]: type as Loader,
          };
        }, {} as MapType<Loader>)
    )
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
      choices: [
        PlatformOptions.BROWSER,
        PlatformOptions.NODE,
        PlatformOptions.NEUTRAL,
      ] as const,
      coerce: (value: PlatformOptions): Platform => value,
      default: PlatformOptions.BROWSER,
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
      array: true,
      desc: "Text to be prepended to each output file of type T where T is one of: css | js",
      group: "Advanced options",
    })
    .coerce("banner", (values: string[]) =>
      values.reduce((banners, current) => {
        const [type, comment] = current.split("=");

        if (!comment) throw new Error(`Invalid banner: ${current}`);
        return {
          ...banners,
          [type]: comment,
        };
      }, {} as MapType)
    )
    .option("charset", {
      string: true,
      desc: "Do not escape UTF-8 code points",
      choices: [CharsetOptions.ASCII, CharsetOptions.UTF8],
      coerce: (value): Charset => value,
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
      string: true,
      choices: [DropOptions.CONSOLE, DropOptions.DEBUGGER] as const,
      desc: "Remove certain constructs (console | debugger)",
      group: "Advanced options",
    })
    .coerce("drop", (values: string[]) => values.map((value) => value as Drop))
    .option("entry-name", {
      string: true,
      desc: 'Path template to use for entry point output paths (default "[dir]/[name]", can also use "[hash]")',
      group: "Advanced options",
    })
    .option("footer", {
      array: true,
      string: true,
      desc: "Text to be appended to each output file of type T where T is one of: css | js",
      group: "Advanced options",
    })
    .coerce("footer", (values: string[]) =>
      values.reduce((footers, current) => {
        const [type, comment] = current.split("=");

        if (!comment) throw new Error(`Invalid footer: ${current}`);
        return {
          ...footers,
          [type]: comment,
        };
      }, {} as MapType)
    )
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
      string: true,
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
      choices: [JsxOptions.TRANSFORM, JsxOptions.PRESERVE] as const,
      coerce: (value: JsxOptions): JSX => value,
      default: JsxOptions.TRANSFORM,
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
        LegalCommentOptions.NONE,
        LegalCommentOptions.INLINE,
        LegalCommentOptions.EOF,
        LegalCommentOptions.LINKED,
        LegalCommentOptions.EXTERNAL,
      ] as const,
      coerce: (value: LegalCommentOptions): LegalComments => value,
      default: LegalCommentOptions.EOF,
      desc: "Where to place legal comments (none | inline | eof | linked | external, default eof when bundling and inline otherwise)",
      group: "Advanced options",
    })
    .option("log-level", {
      string: true,
      choices: [
        LogLevelOptions.VERBOSE,
        LogLevelOptions.DEBUG,
        LogLevelOptions.INFO,
        LogLevelOptions.WARNING,
        LogLevelOptions.ERROR,
        LogLevelOptions.SILENT,
      ],
      coerce: (value): LogLevel => value,
      default: LogLevelOptions.INFO,
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
      string: true,
      desc: 'Override the main file order in package.json (default "browser,module,main" when platform is browser and "main,module" when platform is node)',
      group: "Advanced options",
    })
    .option("metafile", {
      boolean: true,
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
    .coerce("out-extension", (values: string[]) =>
      values.reduce((outExtension, current) => {
        const [extIn, extOut] = current.split("=");

        if (!extOut) throw new Error(`Invalid out-extension: ${current}`);
        return {
          ...outExtension,
          [extIn]: extOut,
        };
      }, {} as MapType)
    )
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
      string: true,
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
    .coerce("sourcemap", (value: boolean | string) => {
      if (typeof value === "string") {
        if (!Object.values<string>(SourceMapOptions).includes(value))
          throw new Error(`Invalid sourcemap: ${value}`);
        return value as SourceMapOptions;
      }
      return value;
    })
    .command(
      "build",
      false,
      {
        entryPoints: {},
      },
      (args) => {
        // eslint-disable-next-line no-console
        console.log("Default command: ", args);
      }
    )
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
    .alias("v", "version").argv;

const runService = async (sendPings = false) => {
  if (sendPings) logger.level = "info";
};

const Run = async (options: ExtendedBuildOptions): Promise<number> => {
  const buildOptions: BuildOptions = options;

  if (env.NODE_PATH) buildOptions.nodePaths = env.NODE_PATH.split(delimiter);

  await build(buildOptions);
  return 0;
};

const setLogLevel = async (options: ExtendedBuildOptions) => {
  if (options.logLevel) {
    logger.level = options.logLevel;
  } else {
    logger.level = LogLevelOptions.SILENT;
  }

  if (options.verbose) logger.level = LogLevelOptions.DEBUG;
};

export const runCli = async <U>(blues: ArgumentsCamelCase<U>) => {
  let format: Format = (blues.format ?? "cjs") as Format;

  if (blues.format === undefined && blues.platform === "browser")
    format = "iife";

  const options: ExtendedBuildOptions = { ...blues, format };
  return options;
};

const initCLI = async () => {
  // TODO Global line
  const parsedOptions = await parseCLIArguments(yargs(hideBin(argv)));
  let format: Format = (parsedOptions.format ?? "cjs") as Format;

  if (
    parsedOptions.format === undefined &&
    parsedOptions.platform === "browser"
  )
    format = "iife";

  const options: ExtendedBuildOptions = {
    ...parsedOptions,
    format,
  };

  await setLogLevel(options);

  if (options.service) {
    if (options.service !== version) {
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
