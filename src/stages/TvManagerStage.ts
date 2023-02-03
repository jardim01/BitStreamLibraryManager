import {Stage} from "./Stage";
import {Command} from "../domain/Command";
import * as fs from "fs";
import {loadTvLibrary} from "../libraries";
import {TvShowLibrary} from "../domain/libraries/tv/TvShowLibrary";
import colorizeJson = require("json-colorizer");
import {confirm, readLine} from "./utils";

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
            /load (.+)/,
            "Load library from file",
            (match) => this.loadLibrary(match),
        ),
        new Command(
            /print/,
            "Prints the current library",
            () => this.printLibrary(),
        ),
        new Command(
            /new/,
            "Creates a new library",
            () => this.newLibrary(),
        ),
    ];

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
            console.log("File does not exist");
            return;
        }
        try {
            this.library = loadTvLibrary(libraryPath);
            this.unsavedChanges = false;
        } catch (e) {
            if (e instanceof Error) console.log(e.message);
            else console.log(`Something went wrong:\n${e}`);
        }
    }

    private async printLibrary() {
        if (this.library === null) {
            console.log("No library");
            return;
        }

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
}
