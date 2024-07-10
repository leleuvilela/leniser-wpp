import { Message } from "whatsapp-web.js";
import { mongoClient } from "../clients/mongo";

async function handleRanking(msg: Message) {
    let startDate: Date;
    let endDate: Date;
    let title: String;

    if (msg.body.toLowerCase() === "!ranking dia") {
        startDate = getStartOfDay();
        endDate = new Date();
        title = "Ranking do Dia";
    } else if (msg.body.toLowerCase() === "!ranking semana") {
        startDate = getStartOfWeek();
        endDate = new Date();
        title = "Ranking da Semana";
    } else if (msg.body.toLowerCase() === "!ranking mes") {
        startDate = getStartOfMonth();
        endDate = new Date();
        title = "Ranking do Mês";
    } else if (msg.body.toLowerCase() === "!ranking") {
        startDate = new Date(0); // Unix epoch start
        endDate = new Date();
        title = "Ranking Geral";
    } else {
        msg.reply("🤖 Comando inválido. Tente `!menu`.");
        return;
    }

    var response = await generateMessageCountsText(startDate, endDate, title);

    msg.reply(`🤖 ${response}`);
}

function getStartOfDay(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function getStartOfWeek(): Date {
    const now = new Date();
    const firstDayOfWeek = now.getDate() - now.getDay();
    return new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
}

function getStartOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}

async function generateMessageCountsText(startDate: Date, endDate: Date, title: String) {
    const results = await getMessageCountsByUser(startDate, endDate);

    if (!results || results.length === 0) {
        console.log("No messages found.");
        return "Não encontramos mensagens nesse período.";
    }

    let messageText = `📊 *${title}* 📊\n\n`;
    results.forEach((result, index) => {
        messageText += `${index+1}º - 👤 ${result._id}: ${result.count}\n`;
    });

    return messageText;
}

async function getMessageCountsByUser(startDate: Date, endDate: Date) {
    try {
        const db = mongoClient.db("rap");
        const collection = db.collection("messages");

        const pipeline = [
            {
                $match: {
                    timestamp: {
                        $gte: Math.floor(startDate.getTime() / 1000),
                        $lte: Math.floor(endDate.getTime() / 1000)
                    }
                }
            },
            { $group: { _id: "$_data.notifyName", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        return results;
    } catch (error) {
        console.error("Error fetching message counts by user:", error);
    }
}

export { handleRanking };

