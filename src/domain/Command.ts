type CommandHandler = (match: RegExpExecArray) => Promise<void>

export class Command {
    regExp: RegExp;
    description: string;
    handler: CommandHandler;

    constructor(regExp: RegExp, description: string, handler: CommandHandler) {
        this.regExp = regExp;
        this.description = description;
        this.handler = handler;
    }
}
