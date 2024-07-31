import { injectable, inject } from 'inversify';
import { type Message } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { IHandler } from '../contracts/IHandler';

@injectable()
export class PingHandler implements IHandler {
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;

    public command = '!ping';

    canHandle(msg: Message): boolean {
        return msg.body.startsWith(this.command);
    }

    async handle(msg: Message): Promise<Message> {
        const { defaultMemberConfigs } = await this.configsRepository.getDefaultConfigs();

        return msg.reply(`${defaultMemberConfigs.botPrefix} pong!`);
    }
}
