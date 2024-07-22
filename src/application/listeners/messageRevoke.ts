import { IListener } from "../contracts/IListener";
import { inject, injectable } from "inversify";
import { type Client as WwebClient } from "whatsapp-web.js";
import { TYPES } from '../../ioc/types';
import { AllowedNumbersRepository } from "../../infrastructure/repositories/allowedNumbersRepository";

@injectable()
class MessageRevokeListener implements IListener {
    wwebClient: WwebClient;
    allowedNumbersRepository: AllowedNumbersRepository;

    constructor(
        @inject(TYPES.WwebClient) wwebClient: WwebClient,
        @inject(TYPES.AllowedNumbersRepository) allowedNumbersRepository: AllowedNumbersRepository,
    ) {
        this.wwebClient = wwebClient;
        this.allowedNumbersRepository = allowedNumbersRepository;
    }

    public async initialize() {
        this.wwebClient.on('message_revoke_everyone', async (after, before) => {
            //TODO: get ids from mongo and check if the message is from a valid group
            if (!this.allowedNumbersRepository.isAllowed(after.from)) {
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
