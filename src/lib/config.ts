import { Charset, Format, LogLevel, Platform } from "esbuild";

import type CLIOptions from "./args";
import {
  CharsetOptions,
  DropOptions,
  FormatOptions,
  JSX,
  JsxOptions,
  LegalCommentOptions,
  LegalComments,
  LogLevelOptions,
  PlatformOptions,
  SourceMapOptions,
} from "./types";

const VERSION = "0.0.1";
const NAME = "yarn-esbuild";

const ESBuildOptions: CLIOptions = {
  bundle: {
    boolean: true,
    desc: "Bundle all dependencies into the output files",
    group: "Simple options",
  },
  define: {
    array: true,
    string: true,
    desc: "Substitute K with V while parsing",
    group: "Simple options",
  },
  external: {
    string: true,
    array: true,
    desc: "Exclude module M from the bundle (can use * wildcards)",
    group: "Simple options",
  },
  format: {
    string: true,
    choices: [FormatOptions.LIFE, FormatOptions.CJS, FormatOptions.ESM],
    coerce: (value: string): Format => value as Format,
    desc: "Output format (iife | cjs | esm, no default when not bundling, otherwise default is iife when platform is browser and cjs when platform is node)",
    group: "Simple options",
  },
  loader: {
    array: true,
    string: true,
    desc: "Use loader L to load file extension X, where L is one of: js | jsx | ts | tsx | css | json | text | base64 | file | dataurl | binary",
    group: "Simple options",
  },
  minify: {
    boolean: true,
    desc: "Minify the output (sets all --minify-* flags)",
    group: "Simple options",
  },
  outdir: {
    string: true,
    desc: "The output directory (for multiple entry points)",
    group: "Simple options",
  },
  outfile: {
    string: true,
    desc: "The output file (for one entry point)",
    group: "Simple options",
  },
  platform: {
    choices: [
      PlatformOptions.BROWSER,
      PlatformOptions.NODE,
      PlatformOptions.NEUTRAL,
    ] as const,
    coerce: (value: PlatformOptions): Platform => value,
    default: PlatformOptions.BROWSER,
    desc: " Platform target (browser | node | neutral, default browser)",
    group: "Simple options",
  },
  serve: {
    string: true,
    desc: "Start a local HTTP server on this host:port for outputs",
    group: "Simple options",
  },
  sourcemap: {
    boolean: true,
    string: true,
    choices: [
      SourceMapOptions.INLINE,
      SourceMapOptions.EXTERNAL,
      SourceMapOptions.BOTH,
      "true",
      "false",
    ],
    coerce: (value: string): SourceMapOptions | boolean => {
      if (value === "true") {
        return true;
      }
      if (value === "false") {
        return false;
      }
      return value as SourceMapOptions;
    },
    desc: "Emit a source map",
    group: "Simple options",
  },
  splitting: {
    boolean: true,
    desc: "Enable code splitting (currently only for esm)",
    group: "Simple options",
  },
  target: {
    string: true,
    desc: "Environment target (e.g. es2017, chrome58, firefox57, safari11, edge16, node10, default esnext)",
    group: "Simple options",
  },
  watch: {
    boolean: true,
    desc: "Watch mode: rebuild on file system changes",
    group: "Simple options",
  },
  analyze: {
    string: true,
    desc: 'Print a report about the contents of the bundle (use "--analyze=verbose" for a detailed report)',
    group: "Advanced options",
  },
  banner: {
    string: true,
    array: true,
    desc: "Text to be prepended to each output file of type T where T is one of: css | js",
    group: "Advanced options",
  },
  charset: {
    string: true,
    desc: "Do not escape UTF-8 code points",
    choices: [CharsetOptions.ASCII, CharsetOptions.UTF8],
    coerce: (value: string): Charset => value as Charset,
    group: "Advanced options",
    default: "UTF-8",
  },
  color: {
    boolean: true,
    desc: "Force use of color terminal escapes",
    group: "Advanced options",
  },
  drop: {
    array: true,
    string: true,
    choices: [DropOptions.CONSOLE, DropOptions.DEBUGGER] as const,
    desc: "Remove certain constructs (console | debugger)",
    group: "Advanced options",
  },
  footer: {
    array: true,
    string: true,
    desc: "Text to be appended to each output file of type T where T is one of: css | js",
    group: "Advanced options",
  },
  inject: {
    array: true,
    string: true,
    desc: "Import the file F into all input files and automatically replace matching globals with imports",
    group: "Advanced options",
  },
  jsx: {
    string: true,
    choices: [JsxOptions.TRANSFORM, JsxOptions.PRESERVE] as const,
    coerce: (value: JsxOptions): JSX => value,
    default: JsxOptions.TRANSFORM,
    desc: 'Set to "preserve" to disable transforming JSX to JS',
    group: "Advanced options",
  },
  metafile: {
    boolean: true,
    desc: "Write metadata about the build to a JSON file",
    group: "Advanced options",
  },
  outbase: {
    string: true,
    desc: "The base path used to determine entry point output paths (for multiple entry points)",
    group: "Advanced options",
  },
  pure: {
    array: true,
    string: true,
    desc: "Mark the name N as a pure function for tree shaking",
    group: "Advanced options",
  },
  tsconfig: {
    string: true,
    desc: "Use this tsconfig.json file instead of other ones",
    group: "Advanced options",
  },
  ping: {
    boolean: true,
    hidden: true,
  },
  service: {
    string: true,
    hidden: true,
  },
  verbose: {
    boolean: true,
    hidden: true,
  },
  allowOverwrite: {
    boolean: true,
    desc: "Allow output files to overwrite input files",
    group: "Advanced options",
  },
  assetNames: {
    string: true,
    desc: 'Path template to use for "file" loader files (default "[name]-[hash]")',
    group: "Advanced options",
  },
  chunkNames: {
    string: true,
    desc: 'Path template to use for code splitting chunks (default "[name]-[hash]")',
    group: "Advanced options",
  },
  globalName: {
    string: true,
    desc: "The name of the global for the IIFE format",
    group: "Advanced options",
  },
  ignoreAnnotations: {
    boolean: true,
    desc: "Enable this to work with packages that have incorrect tree-shaking annotations",
    group: "Advanced options",
  },
  jsxFactory: {
    string: true,
    desc: "What to use for JSX instead of React.createElement",
    group: "Advanced options",
  },
  jsxFragment: {
    string: true,
    desc: "What to use for JSX instead of React.Fragment",
    group: "Advanced options",
  },
  keepNames: {
    boolean: true,
    desc: 'Preserve "name" on functions and classes',
    group: "Advanced options",
  },
  legalComments: {
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
  },
  logLevel: {
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
  },
  logLimit: {
    number: true,
    desc: "Maximum message count or 0 to disable (default 6)",
    default: 6,
    group: "Advanced options",
  },
  mainFields: {
    array: true,
    string: true,
    desc: 'Override the main file order in package.json (default "browser,module,main" when platform is browser and "main,module" when platform is node)',
    group: "Advanced options",
  },
  minifyWhitespace: {
    boolean: true,
    desc: "Remove whitespace in output files",
    group: "Advanced options",
  },
  minifyIdentifiers: {
    boolean: true,
    desc: "Shorten identifiers in output files",
    group: "Advanced options",
  },
  minifySyntax: {
    boolean: true,
    desc: "Use equivalent but shorter syntax in output files",
    group: "Advanced options",
  },
  outExtension: {
    array: true,
    desc: 'Use a custom output extension instead of ".js"',
    group: "Advanced options",
  },
  preserveSymlinks: {
    boolean: true,
    desc: "Disable symlink resolution for module lookup",
    group: "Advanced options",
  },
  publicPath: {
    string: true,
    desc: 'Set the base URL for the "file" loader',
    group: "Advanced options",
  },
  resolveExtensions: {
    array: true,
    default: [".tsx", ".ts", ".jsx", ".js", ".css", ".json"],
    desc: 'A comma-separated list of implicit extensions (default ".tsx,.ts,.jsx,.js,.css,.json")',
    group: "Advanced options",
  },
  sourceRoot: {
    string: true,
    desc: ' Sets the "sourceRoot" field in generated source maps',
    group: "Advanced options",
  },
  sourcesContent: {
    boolean: true,
    default: false,
    desc: 'Omit "sourcesContent" in generated source maps',
    group: "Advanced options",
  },
  treeShaking: {
    boolean: true,
    desc: "Force tree shaking on or off (false | true)",
    group: "Advanced options",
  },
  port: {
    number: true,
    desc: "The HTTP port can optionally be configured here.",
    default: 8000,
    group: "Serve options",
  },
  host: {
    string: true,
    desc: "The HTTP host can optionally be configured here.",
    default: "0.0.0.0",
    group: "Serve options",
  },
  servedir: {
    string: true,
    desc: "This is a directory of extra content for esbuild's HTTP server to serve instead of a 404 when incoming requests don't match any of the generated output file paths.",
    hidden: true,
  },
};
export { ESBuildOptions, NAME, VERSION };
