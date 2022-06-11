import fs from "fs";

type PassioneConfiguration = {
    exclude?: string[],
}

export function loadJson<T = any>(path: string): T {
    const raw = fs.readFileSync(path).toString("utf-8");
    return JSON.parse(raw);
}

export class ConfigurationManager {
    private static read: boolean = false; 
    private static configuration?: PassioneConfiguration;

    private static loadConfiguration() {
        ConfigurationManager.read = true;
        try {
            ConfigurationManager.configuration = loadJson("passionerc.json");
        } catch (e) {
            console.warn("Couldn't read passionerc.json:", e);
        }
        return ConfigurationManager.configuration;
    }

    private static getConfiguration() {
        if (ConfigurationManager.read) {
            return ConfigurationManager.configuration;
        } else {
            return ConfigurationManager.loadConfiguration();
        }
    }

    public static get exclude() {
        return ConfigurationManager.getConfiguration()?.exclude ?? [];
    }
}
