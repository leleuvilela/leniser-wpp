import { Container } from 'inversify';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { Client } from 'whatsapp-web.js';
import { Application } from '../app';
import { IApplication } from '../application/contracts/IApplication';
import { IHandler } from '../application/contracts/IHandler';
import { IResponseService } from '../application/contracts/IResponseService';
import { AuthenticationListener } from '../application/listeners/authentication';
import { IListener } from '../application/contracts/IListener';
import { MessageCreateListener } from '../application/listeners/messageCreate';
import { wwebClient } from '../application/wweb';
import { mongoClient } from '../infrastructure/mongo';
import { openaiClient } from '../infrastructure/openai';
import { ResponseService } from '../infrastructure/services/responseService';
import { TYPES } from './types';
import { MessageObserver } from '../application/observers/messageObserver';
import { IConfigsRepository } from '../application/contracts/IConfigsRepository';
import { ConfigsRepository } from '../infrastructure/repositories/configsRepository';
import { PingHandler } from '../application/events/ping';
import { Logger } from 'winston';
import { logger } from '../logger';
import { NotificarHandler } from '../application/events/notificar';
import { IContactsRepository } from '../application/contracts/IContactsRepository';
import { ContactsRepository } from '../infrastructure/repositories/contactsRepository';
import { ContatosHandler } from '../application/events/contatos';

const container = new Container();

container.bind<OpenAI>(TYPES.OpenAIClient).toConstantValue(openaiClient);
container.bind<MongoClient>(TYPES.MongoClient).toConstantValue(mongoClient);
container.bind<Client>(TYPES.WwebClient).toConstantValue(wwebClient);

container.bind<Logger>(TYPES.Logger).toConstantValue(logger);

container.bind(TYPES.MessageObserver).to(MessageObserver);

container.bind<IListener>(TYPES.AuthenticationListener).to(AuthenticationListener);
container.bind<IListener>(TYPES.MessageCreateListener).to(MessageCreateListener);

container.bind<IHandler>(TYPES.PingHandler).to(PingHandler);
container.bind<IHandler>(TYPES.NotificarHandler).to(NotificarHandler);
container.bind<IHandler>(TYPES.ContatosHandler).to(ContatosHandler);

container
    .bind<IConfigsRepository>(TYPES.ConfigsRepository)
    .to(ConfigsRepository)
    .inSingletonScope();
container
    .bind<IContactsRepository>(TYPES.ContactsRepository)
    .to(ContactsRepository)
    .inSingletonScope();

container.bind<IResponseService>(TYPES.ResponseService).to(ResponseService);

container.bind<IApplication>(TYPES.Application).to(Application);

export { container };
