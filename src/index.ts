import 'dotenv/config'
import { wwebClient } from './clients/wweb';
import "./listeners"

function main() {
    console.log("Initializing wwapweb client");
    wwebClient.initialize();
}

main();

