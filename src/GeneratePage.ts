import { generateBlocks } from "./GenerateBlocks.js";
import { minify } from "html-minifier";

export async function generatePage(page: string, blocksPath: string) {
    return minify(await generateBlocks(page, blocksPath), {
        collapseWhitespace: true,
    });
}
