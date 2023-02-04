import {MainStage} from "./stages/MainStage";

async function main() {
    await MainStage.runLoop();
    process.exit();
}

void main();
