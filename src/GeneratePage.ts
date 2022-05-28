import { generateBlocks } from "./GenerateBlocks.js";

export async function generatePage(page: string, blocksPath: string) {
    return generateBlocks(page, blocksPath);
}
