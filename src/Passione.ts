import { generatePage } from "./GeneratePage.js";
import { globby as glob } from "globby";
import fs from "fs";
import path from "path";

export async function compile(inputPath: string, outputPath: string) {
    const normalizedInputPath = inputPath
        .replaceAll("\\", "/")
        .replace(/\/$/, "");

    try {
        fs.mkdirSync(outputPath, {
            recursive: true,
        });
    } catch {
        // Ignore the exception...
    }
    
    const pages = await glob(`${normalizedInputPath}/pages/*/**`, {
        absolute: true,
    });

    const blocksPath = `${normalizedInputPath}/blocks`;
    
    for (const page of pages) {
        const contents = fs.readFileSync(page).toString("utf8");
        const output = await generatePage(contents, blocksPath);
        const outFile = path.basename(page);
        fs.writeFileSync(path.join(outputPath, outFile), output);
    }
}
