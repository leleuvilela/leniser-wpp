import { Message } from "whatsapp-web.js";
import { handleMenu, handlePing, handleBot, handleChecagem, handleFala, handleImagem, handleRankingImage, handleRanking, handleTranscrever, handleSticker, handleAA } from "../events";

interface Listener {
    event: string;
    listener: (msg: Message) => void;
}

export class MessageObserver {
    listeners: Listener[];

    constructor() {
        this.listeners = [];
    }

    public startListeners() {
        this.addListener("!menu", handleMenu);
        this.addListener('!ping', handlePing);
        this.addListener("!bot", handleBot);
        this.addListener("!checagem", handleChecagem);
        this.addListener("!fala", handleFala);
        this.addListener("!imagem", handleImagem);
        this.addListener("!ranking-imagem", handleRankingImage);
        this.addListener("!ranking", handleRanking);
        this.addListener("!transcrever", handleTranscrever);
        this.addListener("!sticker", handleSticker);
        this.addListener("!aa", handleAA);
    }

    public addListener(event: string, listener: (msg: Message) => void) {
        this.listeners.push({ event, listener });
    }

    public notify(event: string, msg: Message) {
        this.listeners.forEach(listener => {
            if (listener.event === event) {
                listener.listener(msg);
            }
        });
    }
}
