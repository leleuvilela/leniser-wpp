import { type Client as WwebClient } from 'whatsapp-web.js';
import { IApplication } from './application/contracts/IApplication';
import { inject, injectable } from 'inversify';
import { TYPES } from './ioc/types';
import { IConfigsRepository } from './application/contracts/IConfigsRepository';
import { IListener } from './application/contracts/IListener';
import { IMembersRepository } from './application/contracts/INumberPermissionsRepository';
import { Logger } from 'winston';

@injectable()
class Application implements IApplication {
    @inject(TYPES.WwebClient) wweb: WwebClient;
    @inject(TYPES.AuthenticationListener) authenticationListener: IListener;
    @inject(TYPES.MessageCreateListener) messageCreateListener: IListener;
    @inject(TYPES.MessageRevokeListener) messageRevokeListener: IListener;
    @inject(TYPES.GroupJoinListener) groupJoinListener: IListener;
    @inject(TYPES.ConfigsRepository) configsRepository: IConfigsRepository;
    @inject(TYPES.MembersRepository) membersRepository: IMembersRepository;
    @inject(TYPES.Logger) logger: Logger;

    public async start() {
        this.logger.info('Getting configs');
        await this.configsRepository.fetchDefaultConfigs();

        this.logger.info('Starting wweb listeners');
        this.authenticationListener.initialize();
        this.messageCreateListener.initialize();
        this.messageRevokeListener.initialize();
        this.groupJoinListener.initialize();

        this.logger.info('Initializing wwapweb client');
        this.wweb.initialize();
    }

    public async updateConfigs() {
        this.logger.info('Updating configs');
        this.configsRepository.fetchDefaultConfigs();
        this.membersRepository.fetchAll();
    }
}

export { Application };
