import {Command} from "../domain/Command";
import {Stage} from "./Stage";
import {TvManagerStage} from "./TvManagerStage";
import {MovieManagerStage} from "./MovieManagerStage";

class _MainStage extends Stage {
    override path = ["BSLM"];
    override commands = [
        new Command(
            /^tv$/,
            "Manage tv libraries",
            () => this.enterTvManagerStage(),
        ),
        new Command(
            /^movie$/,
            "Manage movie libraries",
            () => this.enterMovieManagerStage(),
        ),
    ];

    private async enterTvManagerStage() {
        const stage = new TvManagerStage(this.path);
        await stage.runLoop();
    }

    private async enterMovieManagerStage() {
        const stage = new MovieManagerStage(this.path);
        await stage.runLoop();
    }
}

export const MainStage = new _MainStage();
