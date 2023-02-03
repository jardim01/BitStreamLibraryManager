import * as readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

export async function readLine(prompt: string): Promise<string> {
    process.stdout.write(prompt);
    return new Promise((resolve, _) => {
        rl.removeAllListeners("line");
        rl.on("line", (data) => {
            rl.removeAllListeners("line");
            resolve(data.trim());
        });
    });
}

export async function readCommand(path: Array<string>): Promise<string> {
    const prompt = path.join("\\") + "> ";
    return await readLine(prompt);
}

export async function confirm(text: string): Promise<boolean> {
    const prompt = `${text}. Are you sure you want to continue? (y/n) > `;
    while (true) {
        const response = await readLine(prompt);
        if (response === "y") return true;
        if (response === "n") return false;
    }
}
