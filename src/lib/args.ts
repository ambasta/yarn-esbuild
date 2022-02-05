import type { Options } from "yargs";

import type { ExtendedBuildOptions } from "./types.js";

type CLIOptions = {
  [key in keyof ExtendedBuildOptions]: Options;
};

export default CLIOptions;
