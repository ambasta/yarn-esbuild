import { Command, Flags } from "@oclif/core";

export default class ESBuildCommand extends Command {
  static override description = "https://esbuild.github.io/";

  static override strict = true;

  static override args = [
    { name: "entry points", require: true, string: true },
  ];

  static override flags = {
    bundle: Flags.boolean({
      summary: "Bundle all dependencies into the output files",
      description: "https://esbuild.github.io/api/#bundle",
    }),
  };

  async run() {
    const { args } = await this.parse(ESBuildCommand);
    this.log(args.firstArg);
  }
}
