import { Message } from 'whatsapp-web.js';

export enum RankingType {
    DIA_ATUAL = 'Dia Atual',
    DIA_ESPECIFICO = 'Dia Especifico',
    SEMANAL = 'Semana',
    MENSAL = 'Mês',
    GERAL = 'Geral',
}

export class RankingParameters {
    type: RankingType;
    isGraph: boolean;
    day: string;

    constructor(msg: Message) {
        const messageParams = msg.body.trim().split(' ');

        if (messageParams.includes('graph')) {
            this.isGraph = true;
        }

        if (messageParams.length === 1) {
            this.type = RankingType.GERAL;
            return this;
        }

        const dateRegex = /\b\d{2}\/\d{2}\/\d{4}\b/;
        if (dateRegex.test(messageParams[1])) {
            this.type = RankingType.DIA_ESPECIFICO;
            const dateParams = messageParams[1].split('/');
            this.day = `${dateParams[2]}-${dateParams[1]}-${dateParams[0]}`;
            return this;
        }

        if (messageParams.includes('dia')) {
            this.type = RankingType.DIA_ATUAL;
        } else if (messageParams.includes('semana')) {
            this.type = RankingType.SEMANAL;
        } else if (messageParams.includes('mes')) {
            this.type = RankingType.MENSAL;
        }
    }

    getTitle(): string {
        if (this.type === RankingType.DIA_ESPECIFICO) {
            const dateParams = this.day.split('-');
            return `Ranking do dia ${dateParams[2]}/${dateParams[1]}/${dateParams[0]}`;
        }
        if (this.type === RankingType.DIA_ATUAL || this.type === RankingType.MENSAL) {
            return `Ranking do ${this.type}`;
        }

        if (this.type === RankingType.SEMANAL) {
            return `Ranking da ${this.type}`;
        }

        return `Ranking ${this.type}`;
    }
}
