import * as readline from "readline";
import {Resolution} from "../domain/libraries/Resolution";
import {sPathSep, sPrompt, sStagePath} from "../styles";

let lines: Array<string> | null = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});

export async function readLine(prompt: string, style: boolean = true): Promise<string> {
    const _prompt = (style) ? sPrompt(prompt) : prompt;
    if (!process.stdin.isTTY) {
        if (lines === null) {
            lines = [];
            for await (const line of rl) {
                lines.push(line);
            }
        }
        process.stdout.write(_prompt);
        const line: string | undefined = lines.shift();
        if (line === undefined) throw Error("EOF");
        console.log(line);
        return line;
    }
    return new Promise((resolve, _) => {
        rl.question(_prompt, (res) => {
            resolve(res.trim());
        });
    });
}

export async function readCommand(path: Array<string>): Promise<string> {
    const prompt = path.map((p) => sStagePath(p)).join(sPathSep("\\")) + sPathSep(">") + " ";
    return await readLine(prompt, false);
}

export async function readInteger(prompt: string): Promise<number> {
    while (true) {
        const line = await readLine(prompt);
        const n = Number(line);
        if (Number.isInteger(n)) return n;
    }
}

export async function readTmdbId(prompt: string): Promise<number> {
    while (true) {
        const n = await readInteger(prompt);
        if (n >= 1) return n;
    }
}

export async function readResolution(prompt: string): Promise<Resolution> {
    const possibleValues = ["2160p", "1080p", "720p"];
    while (true) {
        const line = await readLine(prompt);
        if (possibleValues.includes(line)) return line as Resolution;
    }
}

export async function readMagnet(prompt: string): Promise<string> {
    const magnetRegExp = /^magnet:\?xt=urn:btih:[a-zA-Z0-9]{40}.+$/;
    while (true) {
        const line = await readLine(prompt);
        if (magnetRegExp.test(line)) return line;
    }
}

export async function readBoolean(prompt: string): Promise<boolean> {
    while (true) {
        const line = await readLine(prompt);
        if (line === "y") return true;
        else if (line === "n") return false;
    }
}

export async function readSeason(prompt: string): Promise<number> {
    while (true) {
        const n = await readInteger(prompt);
        if (n >= 0) return n;
    }
}

export async function readEpisode(prompt: string): Promise<number> {
    while (true) {
        const n = await readInteger(prompt);
        if (n > 0) return n;
    }
}

export async function confirm(text: string): Promise<boolean> {
    const prompt = `${text}. Are you sure you want to continue? (y/n)> `;
    while (true) {
        const response = await readLine(prompt);
        if (response === "y") return true;
        if (response === "n") return false;
    }
}

type TorrentFile = {
    name: string,
    path: string,
    length: number,
    size: number,
    type: string,
}

export async function getTorrentFiles(client: any, magnet: string): Promise<Array<TorrentFile>> {
    return new Promise((resolve, _) => {
        const torrent = client.add(magnet, {
            destroyStoreOnDestroy: true,
            path: "./tmp",
            skipVerify: true,
        });
        torrent.on("metadata", () => {
            resolve(torrent.files);
            torrent.destroy();
        });
    });
}

export function getSeasonAndEpisode(fileName: string): [season: number | null, episode: number | null] {
    const regExps = [/S(?<sn>\d+)E(?<en>\d+)/i, /(?<sn>\d+)x(?<en>\d+)/i];
    for (const regExp of regExps) {
        const match = regExp.exec(fileName);
        if (match?.groups !== undefined) {
            const sn = match.groups["sn"];
            const en = match.groups["en"];
            return [Number(sn), Number(en)];
        }
    }
    return [null, null];
}
