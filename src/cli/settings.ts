import { pathExists, readJson } from "fs-extra";
import { homedir } from "os";
import { join } from "path";

import { deepClone, deepGet } from "./utils";

enum Command {
  BUILD = "build",
  BUNDLE = "bundle",
}

type Arguments = {
  readonly [name: string]: unknown;
};

type SettingsMap = {
  [key: string]: unknown;
};

const expandHomeDir = (path: string) => {
  if (path.startsWith("~")) return join(homedir(), path.substring(1));
  return path;
};

class Settings {
  constructor(
    private settings: SettingsMap = {},
    public readonly readOnly = false
  ) {}

  public static fromCLIArguments(argv: Arguments): Settings {
    return new Settings({
      debug: argv.debug,
    });
  }

  public async load(filename: string): Promise<this> {
    if (this.readOnly)
      throw new Error(`Cannot load ${filename}: settings object is read-only`);

    this.settings = {};

    const expanded = expandHomeDir(filename);

    if (await pathExists(expanded)) this.settings = await readJson(expanded);
    return this;
  }

  public get empty(): boolean {
    return Object.keys(this.settings).length === 0;
  }

  public get(path: string[]): unknown {
    return deepClone(deepGet(this.settings, path));
  }
}

export { Command, Settings };
