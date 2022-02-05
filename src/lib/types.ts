import type { Loader, LogLevel } from "esbuild";
import { BuildOptions } from "esbuild";

export enum SourceMapOptions {
  INLINE = "inline",
  EXTERNAL = "external",
  BOTH = "both",
}

export enum LegalCommentOptions {
  NONE = "none",
  INLINE = "inline",
  EOF = "eof",
  LINKED = "linked",
  EXTERNAL = "external",
}

export type LegalComments = `${LegalCommentOptions}`;

export enum JsxOptions {
  TRANSFORM = "transform",
  PRESERVE = "preserve",
}

export type JSX = `${JsxOptions}`;

export enum PlatformOptions {
  BROWSER = "browser",
  NODE = "node",
  NEUTRAL = "neutral",
}

export enum FormatOptions {
  LIFE = "life",
  CJS = "cjs",
  ESM = "esm",
}

export enum LoaderOptions {
  JS = "js",
  JSX = "jsx",
  TS = "ts",
  TSX = "tsx",
  CSS = "css",
  JSON = "json",
  TEXT = "text",
  BASE64 = "base64",
  FILE = "file",
  DATAURL = "dataurl",
  BINARY = "binary",
  DEFAULT = "default",
}

export enum LogLevelOptions {
  VERBOSE = "verbose",
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SILENT = "silent",
}

export enum CharsetOptions {
  ASCII = "ascii",
  UTF8 = "utf8",
}

export enum DropOptions {
  CONSOLE = "console",
  DEBUGGER = "debugger",
}

export type MapType<ValueT = string> = { [key: string]: ValueT };

export type LoaderType = { [ext: string]: Loader };

export interface ExtendedBuildOptions extends BuildOptions {
  service?: string;
  ping?: boolean;
  verbose?: boolean;
  serve?: string;
  analyze?: string;
  watch?: boolean;
  logLevel?: LogLevel;
  servedir?: string;
}
