import { parsePage } from "./ParsePage.js";
import { globby as glob } from "globby";
import path from "path";

export async function compile(inputPath: string, outputPath: string) {
    const pages = await glob(`${path.posix.join(inputPath)}/pages/*/**`, {
        absolute: true,
    });

    console.log(pages);
}
