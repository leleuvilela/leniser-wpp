import { inject, injectable } from 'inversify';
import { IListener } from '../contracts/IListener';
import { TYPES } from '../../ioc/types';
import { Events, GroupNotification, type Client as WwebClient } from 'whatsapp-web.js';
import { Member } from '../dtos/members';
import { IMembersRepository } from '../contracts/INumberPermissionsRepository';
import { IConfigsRepository } from '../contracts/IConfigsRepository';
import { Logger } from 'winston';

@injectable()
export class GroupJoinListener implements IListener {
    @inject(TYPES.WwebClient) wwebClient: WwebClient;
    @inject(TYPES.MembersRepository) membersRepository: IMembersRepository;
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.Logger) logger: Logger;

    public async initialize() {
        this.wwebClient.on(Events.GROUP_JOIN, this.handleGroupJoin.bind(this));
        this.logger.info('GroupJoin initialized');
    }

    private async handleGroupJoin(notification: GroupNotification) {
        this.logger.info('GroupJoin', notification.chatId);

        try {
            const chat = await notification.getChat();
            const { defaultMemberConfigs } =
                await this.configsRepository.getDefaultConfigs();

            const member: Member = {
                id: notification.chatId,
                desc: chat.name,
                permissions: [],
                configs: defaultMemberConfigs,
            };

            const memberExists = await this.membersRepository.find(member.id);

            if (memberExists) {
                return;
            }

            await this.membersRepository.create(member);
        } catch (error) {
            this.logger.error('Error on handleGroupJoin', error);
        }
    }
}
