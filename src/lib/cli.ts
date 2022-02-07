import type { Format } from "esbuild";
import { build, BuildOptions, version } from "esbuild";
import { delimiter } from "path";
import Logger from "pino";
import { argv, env, exit, stdin } from "process";
import type { ArgumentsCamelCase } from "yargs";
import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { ESBuildOptions, VERSION } from "./config.js";
import {
  ExtendedBuildOptions,
  LogLevelOptions,
  SourceMapOptions,
} from "./types.js";

const logger = Logger();

export class CLI {
  constructor(private parser: Argv) {
    this.parser.options(ESBuildOptions);
  }
}

const parseCLIArguments = async (parser: Argv) =>
  parser
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
