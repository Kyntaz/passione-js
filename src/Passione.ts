import { generatePage } from "./GeneratePage.js";
import { globby as glob } from "globby";
import fs from "fs";
import path from "path";

function setupOutputPath(inputPath: string, outputPath: string) {
    try {
        fs.rmSync(outputPath, {
            recursive: true,
        });
    } catch {
        // Ignore the exception...
    }

    fs.cpSync(inputPath, outputPath, {
        recursive: true,
    });

    try {
        fs.rmSync(path.join(outputPath, "pages"), {
            recursive: true,
        });
    } catch {
        // Ignore the exception...
    }

    try {
        fs.rmSync(path.join(outputPath, "blocks"), {
            recursive: true,
        });
    } catch {
        // Ignore the exception...
    }
}

export async function compile(inputPath: string, outputPath: string) {
    setupOutputPath(inputPath, outputPath);

    const normalizedInputPath = inputPath
        .replaceAll("\\", "/")
        .replace(/\/$/, "");
    
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
