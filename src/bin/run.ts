import { Errors, flush, run } from "@oclif/core";

run().then(flush).catch(Errors.handle);
