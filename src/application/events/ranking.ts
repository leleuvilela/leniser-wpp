import { type Message } from "whatsapp-web.js";
import { IStartWithHandler } from "../contracts/IHandler";
import { IMessageRepository } from "../contracts/IMessagesRepository";

export class RankingHandler implements IStartWithHandler {
    messageRepository: IMessageRepository;

    public static inject = ['messageRepository'] as const;

    constructor(messageRepository: IMessageRepository) {
        this.messageRepository = messageRepository;
    }

    command: '!ranking';

    async handle(msg: Message): Promise<Message> {

        let startDate: Date;
        let endDate: Date;
        let title: string;

        if (msg.body.toLowerCase() === "!ranking dia") {
            startDate = this.getStartOfDay();
            endDate = new Date();
            title = "Ranking do Dia";
        } else if (msg.body.toLowerCase() === "!ranking semana") {
            startDate = this.getStartOfWeek();
            endDate = new Date();
            title = "Ranking da Semana";
        } else if (msg.body.toLowerCase() === "!ranking mes") {
            startDate = this.getStartOfMonth();
            endDate = new Date();
            title = "Ranking do Mês";
        } else if (msg.body.toLowerCase() === "!ranking") {
            startDate = new Date(0); // Unix epoch start
            endDate = new Date();
            title = "Ranking Geral";
        } else {
            return msg.reply("🤖 Comando inválido. Tente `!menu`.");
        }

        const response = await this.generateMessageCountsText(startDate, endDate, title);

        return msg.reply(`🤖 ${response}`);
    }

    getStartOfDay(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    getStartOfWeek(): Date {
        const now = new Date();
        const firstDayOfWeek = now.getDate() - now.getDay();
        return new Date(now.getFullYear(), now.getMonth(), firstDayOfWeek);
    }

    getStartOfMonth(): Date {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    async generateMessageCountsText(startDate: Date, endDate: Date, title: string) {
        const results = await this.messageRepository.getMessageCountsByUser(startDate, endDate);

        results.forEach((result) => {
            result.name = this.numberNameDict[result.name] || result.name;
        });

        if (!results || results.length === 0) {
            console.log("No messages found.");
            return "Não encontramos mensagens nesse período.";
        }

        let messageText = `📊 *${title}* 📊\n\n`;
        results.forEach((result, index) => {
            messageText += `${index + 1}º - 👤 ${result.name}: ${result.count}\n`;
        });

        return messageText;
    }

    numberNameDict = {
        "556196097230@c.us": "Rafael Mulher",
        "553484073883@c.us": "Meireles",
        "556296103434@c.us": "PPA",
        "553184298900@c.us": "Zé",
        "556294860907@c.us": "Bibi",
        "556298249667@c.us": "Vitão",
        "556181594667@c.us": "Murilo",
        "556295655173@c.us": "Samer",
        "556192286639@c.us": "Deuita",
        "556282742299@c.us": "Lucas Black",
        "556294330143@c.us": "Xande",
        "556286291853@c.us": "Guimas",
        "556499662188@c.us": "Tissa",
        "556296326235@c.us": "Amir",
        "556286316906@c.us": "Ian",
        "556299404588@c.us": "Cris",
        "556298035749@c.us": "Pepes",
        "556286276360@c.us": "Nattan",
        "351914486098@c.us": "Lucas Marina",
        "33749797329@c.us": "JP",
        "351932340769@c.us": "Leleu",
        "556292037887@c.us": "Vinição",
        "556285388408@c.us": "Cabeça",
        "556282294995@c.us": "Paulo",
        "556195208161@c.us": "Joawm",
        "556286000458@c.us": "Ppzim",
        "556296608151@c.us": "Paim",
        "556285109418@c.us": "Gordim",
        "556298277104@c.us": "Luizão",
        "556283282310@c.us": "Gilso",
        "556282378429@c.us": "Mycael",
        "556284845169@c.us": "Danillo Sena",
    };
}

