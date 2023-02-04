import {Stage} from "./Stage";
import {Command} from "../domain/Command";
import * as fs from "fs";
import {loadMovieLibrary} from "../libraries";
import {MovieLibrary} from "../domain/libraries/movie/MovieLibrary";
import colorizeJson = require("json-colorizer");
import {
    confirm, getTorrentFiles, readInteger, readLine,
    readMagnet, readResolution, readTmdbId,
} from "./utils";
import {client} from "../webtorrent";
import {MovieTorrent} from "../domain/libraries/movie/MovieTorrent";
import chalk = require("chalk");
import {sError, sInfo, sSuccess, sWaiting, sWarn} from "../styles";

export class MovieManagerStage extends Stage {
    override path;
    private unsavedChanges: boolean = false;
    private library: MovieLibrary | null = null;

    constructor(path: Array<string>) {
        super();
        this.path = [...path, "Movie Manager"];
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
            "Adds a new torrent to the library",
            () => this.addTorrent(),
        ),
    ];

    private static requireLibrary(library: MovieLibrary | null): library is MovieLibrary {
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
            this.library = loadMovieLibrary(libraryPath);
            this.unsavedChanges = false;
        } catch (e) {
            if (e instanceof Error) console.log(sError(e.message));
            else console.log(sError(`Something went wrong:\n${chalk.dim(e)}`));
        }
    }

    private async saveLibrary(match: RegExpExecArray) {
        if (!MovieManagerStage.requireLibrary(this.library)) return;

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
        if (!MovieManagerStage.requireLibrary(this.library)) return;
        console.log(colorizeJson(JSON.stringify(this.library), {pretty: true}));
    }

    private async newLibrary() {
        if (!await this.confirmDiscardChanges()) return;

        const name = await readLine("Name: ");
        this.library = {
            name: name,
            movies: {},
        };
        this.unsavedChanges = true;
    }

    private async addTorrent() {
        if (!MovieManagerStage.requireLibrary(this.library)) return;

        // FIXME: check if magnet is already on library

        const movieId = await readTmdbId("TMDb movie id: ");
        const label = await readLine("Label: ");
        const resolution = await readResolution(`Resolution ${chalk.dim("[2160p|1080p|720p]")}: `);
        const magnet = await readMagnet("Magnet: ");
        let fileIdx: number;

        console.log(sWaiting("Waiting for torrent metadata..."));
        const _files = await getTorrentFiles(client, magnet);

        // FIXME: Not the best solution because it might be a collection of movies
        const maxSize = Math.max(..._files.map((f) => f.length));
        if (maxSize !== -Infinity) {
            fileIdx = _files.findIndex((f) => f.length === maxSize);
        } else {
            _files.forEach((f, i) => console.log(sInfo(chalk.dim(`${i}.`), f.name)));
            while (true) {
                const n = await readInteger("File Index: ");
                if (n >= 0 && n < _files.length) {
                    fileIdx = n;
                    break;
                }
            }
        }

        const torrent: MovieTorrent = {label, resolution, magnet, file_index: fileIdx};

        this.unsavedChanges = true;
        if (!this.library.movies.hasOwnProperty(movieId)) {
            this.library.movies[movieId] = {torrents: []};
        }
        this.library.movies[movieId].torrents.push(torrent);

        console.log(sSuccess("Torrent added to", movieId));
    }
}
