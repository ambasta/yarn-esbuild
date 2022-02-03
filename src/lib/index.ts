import { pnpPlugin } from "@yarnpkg/esbuild-plugin-pnp";
import { exec } from "child_process";
import compareVersions from "compare-versions";
import {
  build as esbuildBuildFunction,
  BuildOptions,
  BuildResult,
} from "esbuild";
import { stat } from "fs/promises";
import { resolve } from "path";
import { promisify } from "util";

type PackageManager = "npm" | "yarn" | "pnpm";

const cache: Record<string, PackageManager> = {};

const detectLockFile = async (
  cwd: string,
  lockfile: string
): Promise<boolean> => {
  const fileStat = await stat(resolve(resolve(cwd), lockfile));
  if (fileStat.isFile()) return true;
  return false;
};

const detectYarn = async (cwd: string): Promise<boolean> => {
  const yarnLockFile = "yarn.lock";
  if (await detectLockFile(cwd, yarnLockFile)) return true;

  if (resolve(resolve(cwd), "..") === cwd) return false;

  return detectYarn(resolve(resolve(cwd), ".."));
};

const detectNpm = (cwd: string): Promise<boolean> =>
  detectLockFile(cwd, "package-lock.json");

const detectPnpm = (cwd: string): Promise<boolean> =>
  detectLockFile(cwd, "pnpm-lock.yaml");

const getPackageManagerFromLockFile = async (
  cwd = "."
): Promise<PackageManager> => {
  const key = `lockfile_${cwd}`;

  if (cache[key]) return cache[key];

  return Promise.all([detectYarn(cwd), detectNpm(cwd), detectPnpm(cwd)]).then(
    ([isYarn, isNpm, isPnpm]) => {
      if (isYarn) {
        cache[key] = "yarn";
        return "yarn";
      }
      if (isNpm) {
        cache[key] = "npm";
        return "npm";
      }
      if (isPnpm) {
        cache[key] = "pnpm";
        return "pnpm";
      }

      throw new Error("Unable to detect package manager");
    }
  );
};

const detectGlobalCmd = async (cmd: string): Promise<boolean> => {
  const { stdout, stderr } = await promisify(exec)(`${cmd} --version`);
  return !(stderr || !stdout);
};

const getGlobalPackageManager = async (): Promise<PackageManager> => {
  if (await detectGlobalCmd("yarn")) return "yarn";

  if (await detectGlobalCmd("npm")) return "npm";

  if (await detectGlobalCmd("pnpm")) return "pnpm";

  throw new Error("Unable to detect global package manager");
};

const detectPackageManager = async ({
  cwd,
}: {
  cwd?: string;
}): Promise<PackageManager> => {
  try {
    return await getPackageManagerFromLockFile(cwd);
  } catch (_) {
    // eslint-disable-next-line no-console
    console.debug("No lockfile found, trying globals");
  }

  return getGlobalPackageManager();
};

const verifyPackageManagerVersion = async (cmd: string, version: string) => {
  const { stdout, stderr } = await promisify(exec)(`${cmd} --version`);
  if (stderr || !stdout) return false;

  const [, actualVersion] = stdout.split(" ");

  return compareVersions(actualVersion, version) >= 0;
};

const build = async (options: BuildOptions): Promise<BuildResult> => {
  const buildOptions = {
    ...options,
    plugins: options.plugins || [],
  };

  try {
    const packageManager = await detectPackageManager({ cwd: "." });

    if (
      packageManager === "yarn" &&
      (await verifyPackageManagerVersion("yarn", "2.0.0"))
    ) {
      if (
        !buildOptions.plugins.reduce((acc, plugin) => {
          return acc || plugin.name === "pnpPlugin";
        }, false)
      ) {
        buildOptions.plugins.push(pnpPlugin());
      }
    }
  } catch (_) {
    // eslint-disable-next-line no-empty
  }

  return esbuildBuildFunction(buildOptions);
};

export default build;
