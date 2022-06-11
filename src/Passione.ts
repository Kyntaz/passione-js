import { generatePage } from "./GeneratePage.js";
import { globby as glob } from "globby";
import { ConfigurationManager } from "./ConfigurationManager.js";
import fs from "fs-extra";
import path from "path";

function tryRm(rmPath: string) {
    try {
        fs.rmSync(rmPath, {
            recursive: true,
        });
    } catch {
        // Ignore the exception...
    }
}

function tryClearDir(clearPath: string) {
    try {
        fs.emptyDirSync(clearPath);
    } catch {
        // Ignore the exception...
    }
}

function setupOutputPath(inputPath: string, outputPath: string) {
    tryClearDir(outputPath);

    fs.cpSync(inputPath, outputPath, {
        recursive: true,
    });

    tryRm(path.join(outputPath, "pages"));
    tryRm(path.join(outputPath, "blocks"));

    for (const excludePath of ConfigurationManager.exclude) {
        tryRm(path.join(outputPath, excludePath));
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
