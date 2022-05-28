import { compile } from "./Passione.js";
import minimist from "minimist";

const args = minimist(process.argv.slice(2));

compile(args.i ?? ".", args._[0]);
