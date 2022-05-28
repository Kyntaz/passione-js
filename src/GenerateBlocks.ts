import { globby as glob } from "globby";
import fs from "fs";
import path from "path";
import showdown from "showdown";

const blockRegex = /<(?<blockName>[a-zA-Z0-9_]+)\*(?<propsText>.*?)>(?<innerContent>.*)<\/\k<blockName>\*>/s
const simpleBlockRegex = /<(?<blockName>[a-zA-Z0-9_]+)\*(?<propsText>.*?)\/>/s
const blockRegexGlobal = /<(?<blockName>[a-zA-Z0-9_]+)\*(?<propsText>.*?)>(?<innerContent>.*)<\/\k<blockName>\*>/gs
const simpleBlockRegexGlobal = /<(?<blockName>[a-zA-Z0-9_]+)\*(?<propsText>.*?)\/>/gs
const propRegex = /(?<propName>[A-Za-z0-0]*?)=(?<propValue>([A-Za-z0-0]+)|(\".*?\"))/
const propRegexGlobal = /(?<propName>[A-Za-z0-0]*?)=(?<propValue>([A-Za-z0-0]+)|(\".*?\"))/g
const varRegex = /\$\{(?<prop>.*?)\}/
const varRegexGlobal = /\$\{(?<prop>.*?)\}/g

type Block = {
    raw: string,
    props: { [prop: string]: string },
    innerContent?: string,
    name: string,
}

function parseProps(props: string) {
    const individualPropsText = props.match(propRegexGlobal) ?? [];
    return individualPropsText.reduce<{ [prop: string]: string}>((prev, prop) => {
        const match = prop.match(propRegex);

        if (!match || !match.groups?.propName || !match.groups?.propValue) {
            throw new Error(`Couldn't parse property: ${prop}`);
        }

        return {
            ...prev,
            [match.groups.propName]: match.groups.propValue
                .replaceAll("\"", ""),
        };
    }, {});
}

function parseBlock(block: string): Block {
    const match = block.match(blockRegex) ?? block.match(simpleBlockRegex);

    if (!match || !match.groups?.blockName || !match.groups?.propsText) {
        throw new Error(`Couldn't parse block: ${block}`);
    }

    return {
        raw: block,
        innerContent: match.groups.innerContent ?? undefined,
        name: match.groups.blockName,
        props: parseProps(match.groups.propsText),
    };
}

function findBlocks(text: string): Block[] {
    const matches = (text.match(blockRegexGlobal) ?? [])
        .concat(text.match(simpleBlockRegexGlobal) ?? []);
    return matches.map((match) => parseBlock(match));
}

async function generateBlock(block: Block, blocksPath: string): Promise<string> {
    const [blockFile] = await glob(`${blocksPath}/**/${block.name}.*`, {
        absolute: true,
    });

    if (!blockFile) {
        throw new Error(`Block not found: ${block.name}`);
    }

    const blockText = fs.readFileSync(blockFile).toString("utf8");
    if (path.extname(blockFile) === ".html" || path.extname(blockFile) === ".htm") {
        return generateHtmlBlock(block, blockText, blocksPath);
    } else if (path.extname(blockFile) === ".md") {
        return generateMarkdownBlock(block, blockText, blocksPath);
    } else {
        throw new Error(`Unsupported block extension: ${blockFile}`);
    }
}

async function generateHtmlBlock(block: Block, blockText: string, blocksPath: string) {
    const vars = blockText.match(varRegexGlobal) ?? [];
    const blockTextWithoutVars = vars.reduce<string>((prev, propVar) => {
        const match = propVar.match(varRegex);
        const prop = match?.groups?.prop;

        if (!prop) {
            throw new Error(`Could not parse variable: ${propVar}`);
        }

        if (prop === "inner") {
            return prev.replace(propVar, block.innerContent ?? "");
        }
        return prev.replace(propVar, block.props[prop]);
    }, blockText);

    return generateBlocks(blockTextWithoutVars, blocksPath);
}

async function generateMarkdownBlock(block: Block, blockText: string, blocksPath: string) {
    const converter = new showdown.Converter();
    const htmlText = converter.makeHtml(blockText);
    return generateHtmlBlock(block, htmlText, blocksPath);
}

export async function generateBlocks(text: string, blocksPath: string): Promise<string> {
    const blocks = findBlocks(text);
    return blocks.reduce<Promise<string>>(async (prev, block) => {
        return (await prev).replace(block.raw, await generateBlock(block, blocksPath));
    }, Promise.resolve(text));
}
