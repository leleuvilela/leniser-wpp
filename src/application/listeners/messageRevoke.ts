import { IListener } from '../contracts/IListener';
import { inject, injectable } from 'inversify';
import { Events, type Client as WwebClient } from 'whatsapp-web.js';
import { TYPES } from '../../ioc/types';
import { IMembersRepository } from '../contracts/INumberPermissionsRepository';
import { MemberPermission } from '../dtos/members';

@injectable()
class MessageRevokeListener implements IListener {
    wwebClient: WwebClient;
    numberPermissionRepository: IMembersRepository;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: WwebClient,
        @inject(TYPES.MembersRepository)
        numberPermissionRepository: IMembersRepository
    ) {
        this.wwebClient = wwebClient;
        this.numberPermissionRepository = numberPermissionRepository;
    }

    public async initialize() {
        this.wwebClient.on(Events.MESSAGE_REVOKED_EVERYONE, async (after, before) => {
            const numberPermission = await this.numberPermissionRepository.find(
                after.from
            );

            if (
                !numberPermission?.permissions.includes(MemberPermission.MESSAGE_REVOKE)
            ) {
                return;
            }

            if (before && before.type === 'chat') {
                this.wwebClient.sendMessage(
                    after.from,
                    `🤖 apagou mensagem né safado? @${before.author?.split('@')[0]} \n _${before.body}_`,
                    { mentions: before.author ? [before.author] : undefined }
                );
            }
        });
    }
}

export { MessageRevokeListener };
