import { ServeOptions, StdinOptions } from "esbuild";
import type { Options } from "yargs";

import type { ExtendedBuildOptions } from "./types.js";

type CLIOptions =
  | {
      [key in keyof ExtendedBuildOptions]: Options;
    }
  | {
      [key in keyof ServeOptions]: Options;
    };

type AnyObject = {
  [key: string]: unknown;
};

export function asRecursion(data: unknown, prefix = ""): AnyObject {
  if (typeof data === "object" && Array.isArray(data) === false) {
    Object.keys(data).reduce((acc, key) => {
      return {
        ...acc,
      };
    }, {});
    /*
    return Object.keys(data).reduce(
      ([acc, key]: [acc: AnyObject, key: string]) => {},
      {} as AnyObject
    );
    */
  }

  return prefix === "" ? { y: { hello: "world" } } : {};
}

export default CLIOptions;
