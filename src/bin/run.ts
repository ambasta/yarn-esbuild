import pino from "pino";

import { initCLI } from "../lib/cli.js";

const logger = pino({
  name: "esbuild",
  level: "info",
});

initCLI()
  .then((value) => {
    if (value === null) return;

    if (typeof value === "string") logger.info(value);
    else if (typeof value === "number") process.exitCode = value;
  })
  .catch((err) => {
    logger.error(err.message);

    if (err.stack) logger.debug(err.stack);
    process.exitCode = 1;
  });
