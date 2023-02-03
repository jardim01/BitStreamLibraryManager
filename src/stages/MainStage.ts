import {Command} from "../domain/Command";
import {Stage} from "./Stage";
import {TvManagerStage} from "./TvManagerStage";

class _MainStage extends Stage {
    override path = ["BSLM"];
    override commands = [
        new Command(
            /tv/,
            "Manage tv library",
            () => this.enterTvManagerStage(),
        ),
    ];

    private async enterTvManagerStage() {
        const stage = new TvManagerStage(this.path);
        await stage.runLoop();
    }
}

export const MainStage = new _MainStage();
