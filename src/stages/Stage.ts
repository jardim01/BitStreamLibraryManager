import {Command} from "../domain/Command";
import {readCommand} from "./utils";
import {GO_BACK_REGEXP, HELP_REGEX} from "../constants";

export abstract class Stage {
    abstract path: Array<string>;
    abstract commands: Array<Command>;

    private static invalidCommandHandler(cmd: string) {
        console.log(`Invalid command '${cmd}'`);
    }

    private allCommands(): Array<Command> {
        return [
            new Command(
                HELP_REGEX,
                "Displays this message",
                (m) => this.helpHandler(m),
            ),
            ...this.commands,
        ];
    }

    private printCommands() {
        this.allCommands().forEach((c) => {
            console.log(c.regExp, "-", c.description);
        });
        console.log(GO_BACK_REGEXP, "-", "Navigates to previous stage");
    }

    private async helpHandler(_: RegExpExecArray) {
        this.printCommands();
    }

    async runLoop() {
        while (true) {
            const cmd = await readCommand(this.path);
            if (cmd === "") continue;
            if (GO_BACK_REGEXP.exec(cmd) !== null) break;

            let handled = false;
            for (const c of this.allCommands()) {
                const match = c.regExp.exec(cmd);
                if (match === null) continue;

                await c.handler(match);
                handled = true;
            }
            if (!handled) Stage.invalidCommandHandler(cmd);
        }
    }
}
