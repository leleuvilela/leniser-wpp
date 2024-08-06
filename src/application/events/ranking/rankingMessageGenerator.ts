import { MessageCountDto } from '../../dtos/messageCountDto';
import { RankingParameters } from './rankingParameters';

export function generateMessage(
    parameters: RankingParameters,
    messageCounts: MessageCountDto[]
): string {
    let messageText = `📊 *${parameters.getTitle()}* 📊\n\n`;

    const totalMessages = getTotalMessages(messageCounts);
    messageText += `Total de ${totalMessages} mensagens\n\n`;

    return parameters.isGraph
        ? generateGraphText(messageText, messageCounts, totalMessages)
        : generateRankingText(messageText, messageCounts, totalMessages);
}

function getTotalMessages(messageCounts: MessageCountDto[]) {
    return messageCounts.reduce((acc, result) => acc + result.count, 0);
}

function generateGraphText(
    messageText: string,
    messageCounts: MessageCountDto[],
    totalMessages: number
) {
    const bar = '█';

    const highestCount = messageCounts[0].count;
    const charCount = 30;
    const messagesPerBar = Math.floor(highestCount / charCount) || 1;

    messageText +=
        messagesPerBar === 1
            ? `${bar} = ${messagesPerBar} mensagem(s)\n\n`
            : `${bar} = ${messagesPerBar} mensagens\n\n`;

    messageCounts.forEach((result, index) => {
        const barLength = Math.floor(result.count / messagesPerBar);
        const barText = bar.repeat(barLength);

        messageText += getMemberText(index, result, totalMessages);
        messageText += `${barText}\n`;
    });

    return messageText;
}

function getMemberText(
    index: number,
    messageCount: MessageCountDto,
    totalMessages: number
): string {
    const share = getShareForMember(totalMessages, messageCount.count);
    const shareMsg = `${share.toFixed(2)}%`;
    return `${index + 1}º - 👤 ${messageCount.id}: ${messageCount.count} (${shareMsg})\n`;
}

function getShareForMember(totalMessages: number, memberMessages: number): number {
    return (memberMessages / totalMessages) * 100;
}

function generateRankingText(
    messageText: string,
    messageCounts: MessageCountDto[],
    totalMessages: number
) {
    messageCounts.forEach((result, index) => {
        messageText += getMemberText(index, result, totalMessages);
    });

    return messageText;
}
