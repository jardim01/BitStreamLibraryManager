import {Command} from "../domain/Command";
import {readCommand} from "./utils";
import {CLEAR_REGEX, GO_BACK_REGEX, HELP_REGEX} from "../constants";
import {sDesc, sError, sRegExp} from "../styles";

export abstract class Stage {
    abstract path: Array<string>;
    abstract commands: Array<Command>;
    private breakLoop = false;

    private static invalidCommandHandler(cmd: string) {
        console.log(sError(`Invalid command '${cmd}'`));
    }

    private allCommands(): Array<Command> {
        return [
            ...this.commands,
            new Command(
                HELP_REGEX,
                "Displays this message",
                (m) => this.helpHandler(m),
            ),
            new Command(
                CLEAR_REGEX,
                "Clears the terminal screen",
                async () => {
                    process.stdout.write("\x1Bc");
                },
            ),
            new Command(
                GO_BACK_REGEX,
                "Navigates to the previous stage",
                async () => {
                    this.breakLoop = true;
                },
            ),
        ];
    }

    private printCommands() {
        const _allCommands = this.allCommands();
        const regMaxLength = Math.max(..._allCommands.map((c) => `${c.regExp}`.length));
        _allCommands.forEach((c) => {
            const regExpStr = `${c.regExp}`;
            const spaces = regMaxLength - regExpStr.length;
            console.log(sRegExp(c.regExp), " ".repeat(spaces), sDesc(c.description));
        });
    }

    private async helpHandler(_: RegExpExecArray) {
        this.printCommands();
    }

    async runLoop() {
        while (!this.breakLoop) {
            const cmd = await readCommand(this.path);
            if (cmd === "") continue;

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
