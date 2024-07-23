import { IListener } from "../contracts/IListener";
import { inject, injectable } from "inversify";
import { type Client as WwebClient } from "whatsapp-web.js";
import { TYPES } from '../../ioc/types';
import { INumberPermissionRepository } from "../contracts/INumberPermissionsRepository";
import { NumberPermission } from "../dtos/numberPermission";

@injectable()
class MessageRevokeListener implements IListener {
    wwebClient: WwebClient;
    numberPermissionRepository: INumberPermissionRepository;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: WwebClient,
        @inject(TYPES.NumberPermissionRepository) numberPermissionRepository: INumberPermissionRepository,
    ) {
        this.wwebClient = wwebClient;
        this.numberPermissionRepository = numberPermissionRepository;
    }

    public async initialize() {
        this.wwebClient.on('message_revoke_everyone', async (after, before) => {

            const numberPermission = await this.numberPermissionRepository.find(after.from);

            if (!numberPermission?.permissions.includes(NumberPermission.MESSAGE_REVOKE)) {
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
