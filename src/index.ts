import 'dotenv/config'
import { wwebClient } from './clients/wweb';
import "./listeners"
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/healthcheck', (req, res) => {
    res.send('OK');
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

function main() {
    console.log("Initializing wwapweb client");
    wwebClient.initialize();
}

main();

