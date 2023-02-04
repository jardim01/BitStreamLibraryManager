import {Stage} from "./Stage";
import {Command} from "../domain/Command";
import * as fs from "fs";
import {loadTvLibrary} from "../libraries";
import {TvShowLibrary} from "../domain/libraries/tv/TvShowLibrary";
import colorizeJson = require("json-colorizer");
import {
    confirm,
    getSeasonAndEpisode,
    getTorrentFiles, readBoolean, readEpisode,
    readLine,
    readMagnet,
    readResolution, readSeason,
    readTmdbId,
} from "./utils";
import {client} from "../webtorrent";
import {TvShowTorrent} from "../domain/libraries/tv/TvShowTorrent";
import {TvShowTorrentFile} from "../domain/libraries/tv/TvShowTorrentFile";
import chalk = require("chalk");
import {sError, sInfo, sSuccess, sWaiting, sWarn} from "../styles";

export class TvManagerStage extends Stage {
    override path;
    private unsavedChanges: boolean = false;
    private library: TvShowLibrary | null = null;

    constructor(path: Array<string>) {
        super();
        this.path = [...path, "TV Manager"];
    }

    override commands = [
        new Command(
            /^load (.+)$/,
            "Loads a library from the specified file",
            (match) => this.loadLibrary(match),
        ),
        new Command(
            /^save (.+)$/,
            "Saves the library to the specified file",
            (match) => this.saveLibrary(match),
        ),
        new Command(
            /^print$/,
            "Prints the current library",
            () => this.printLibrary(),
        ),
        new Command(
            /^new$/,
            "Creates a new library",
            () => this.newLibrary(),
        ),
        new Command(
            /^add$/,
            "Adds a new torrent to a tv show",
            () => this.addTorrent(),
        ),
    ];

    private static requireLibrary(library: TvShowLibrary | null): library is TvShowLibrary {
        if (library === null) {
            console.log(sWarn("No library"));
            return false;
        }
        return true;
    }

    private async confirmDiscardChanges(): Promise<boolean> {
        if (this.unsavedChanges) {
            const conf = await confirm("You have unsaved changes. If you continue they will be lost");
            if (!conf) return false;
        }
        return true;
    }

    private async loadLibrary(match: RegExpExecArray) {
        if (!await this.confirmDiscardChanges()) return;

        const libraryPath = match[1].trim();
        if (!fs.existsSync(libraryPath) || fs.statSync(libraryPath).isDirectory()) {
            console.log(sError("File does not exist"));
            return;
        }
        try {
            this.library = loadTvLibrary(libraryPath);
            this.unsavedChanges = false;
        } catch (e) {
            if (e instanceof Error) console.log(sError(e.message));
            else console.log(sError(`Something went wrong:\n${chalk.dim(e)}`));
        }
    }

    private async saveLibrary(match: RegExpExecArray) {
        if (!TvManagerStage.requireLibrary(this.library)) return;

        const libraryPath = match[1].trim();
        if (fs.existsSync(libraryPath) && !fs.statSync(libraryPath).isDirectory()) {
            if (!await confirm(`The file "${libraryPath}" already exists`)) return;
        }

        try {
            fs.writeFileSync(libraryPath, JSON.stringify(this.library), {encoding: "utf-8"});
            this.unsavedChanges = false;
            console.log(sSuccess(`Saved library to "${libraryPath}"`));
        } catch (e) {
            console.log(sError("Failed to save library"));
        }
    }

    private async printLibrary() {
        if (!TvManagerStage.requireLibrary(this.library)) return;
        console.log(colorizeJson(JSON.stringify(this.library), {pretty: true}));
    }

    private async newLibrary() {
        if (!await this.confirmDiscardChanges()) return;

        const name = await readLine("Name: ");
        this.library = {
            name: name,
            shows: {},
        };
        this.unsavedChanges = true;
    }

    private async addTorrent() {
        if (!TvManagerStage.requireLibrary(this.library)) return;

        // FIXME: check if magnet is already on library

        const tvId = await readTmdbId("TMDb TV id: ");
        const label = await readLine("Label: ");
        const resolution = await readResolution(`Resolution ${chalk.dim("[2160p|1080p|720p]")}: `);
        const magnet = await readMagnet("Magnet: ");
        const files: { [index: number]: TvShowTorrentFile } = {};

        console.log(sWaiting("Waiting for torrent metadata..."));
        const _files = await getTorrentFiles(client, magnet);

        let _index = 0;
        for (const file of _files) {
            const index = _index++;

            // ignore files
            if (file.name.endsWith(".srt")) continue;
            if (file.name.endsWith(".txt")) continue;

            // use predicted season/episode on known files
            if (/\.(mkv)|(mp4)|(avi)|(mov)$/.test(file.name)) {
                const [pSn, pEn] = getSeasonAndEpisode(file.name);
                if (pSn !== null && pEn !== null) {
                    files[index] = {season: pSn, episode: pEn};
                    continue;
                }
            }

            console.log(sInfo(file.name));
            const map = await readBoolean("Map this file? [y/n]: ");
            if (!map) continue;

            const sn = await readSeason("Season: ");
            const en = await readEpisode("Episode: ");
            files[index] = {season: sn, episode: en};
        }

        const torrent: TvShowTorrent = {label, resolution, magnet, files};

        this.unsavedChanges = true;
        if (!this.library.shows.hasOwnProperty(tvId)) {
            this.library.shows[tvId] = {torrents: []};
        }
        this.library.shows[tvId].torrents.push(torrent);

        console.log(sSuccess("Torrent added to", tvId));
    }
}
