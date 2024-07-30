import { Container } from 'inversify';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { Client } from 'whatsapp-web.js';
import { Application } from '../app';
import { IApplication } from '../application/contracts/IApplication';
import { IAudioService } from '../application/contracts/IAudioService';
import { IHandler, IStartWithHandler } from '../application/contracts/IHandler';
import { IMessageRepository } from '../application/contracts/IMessagesRepository';
import { IResponseService } from '../application/contracts/IResponseService';
import { BotHandler } from '../application/events/bot';
import { FalaHandler } from '../application/events/fala';
import { RankingHandler } from '../application/events/ranking';
import { AuthenticationListener } from '../application/listeners/authentication';
import { IListener } from '../application/contracts/IListener';
import { MessageCreateListener } from '../application/listeners/messageCreate';
import { MessageRevokeListener } from '../application/listeners/messageRevoke';
import { wwebClient } from '../application/wweb';
import { mongoClient } from '../infrastructure/mongo';
import { openaiClient } from '../infrastructure/openai';
import { MessageRepository } from '../infrastructure/repositories/messagesRepository';
import { AudioService } from '../infrastructure/services/audioService';
import { ResponseService } from '../infrastructure/services/responseService';
import { TYPES } from './types';
import { MessageObserver } from '../application/observers/messageObserver';
import { IMembersRepository } from '../application/contracts/INumberPermissionsRepository';
import { MembersRepository } from '../infrastructure/repositories/membersRepository';
import { IGroupMembersRepository } from '../application/contracts/IGroupMembersRepository';
import { GroupMembersRepository } from '../infrastructure/repositories/groupMembersRepository';
import { IConfigsRepository } from '../application/contracts/IConfigsRepository';
import { ConfigsRepository } from '../infrastructure/repositories/configsRepository';
import { TranscreverHandler } from '../application/events/transcrever';
import { DeuitaHandler } from '../application/events/deuita';
import { ITranscriptionService } from '../application/contracts/ITranscriptionService';
import { TranscriptionService } from '../infrastructure/services/transcriptionService';
import { GilsoHandler } from '../application/events/gilso';

const container = new Container();

container.bind<OpenAI>(TYPES.OpenAIClient).toConstantValue(openaiClient);
container.bind<MongoClient>(TYPES.MongoClient).toConstantValue(mongoClient);
container.bind<Client>(TYPES.WwebClient).toConstantValue(wwebClient);

container.bind(TYPES.MessageObserver).to(MessageObserver);

container.bind<IListener>(TYPES.AuthenticationListener).to(AuthenticationListener);
container.bind<IListener>(TYPES.MessageCreateListener).to(MessageCreateListener);
container.bind<IListener>(TYPES.MessageRevokeListener).to(MessageRevokeListener);

container.bind<IStartWithHandler>(TYPES.BotHandler).to(BotHandler);
container.bind<IStartWithHandler>(TYPES.FalaHandler).to(FalaHandler);
container.bind<IStartWithHandler>(TYPES.RankingHandler).to(RankingHandler);
container.bind<IStartWithHandler>(TYPES.TranscreverHandler).to(TranscreverHandler);
container.bind<IHandler>(TYPES.DeuitaHandler).to(DeuitaHandler);
container.bind<IHandler>(TYPES.GilsoHandler).to(GilsoHandler);

container
    .bind<IConfigsRepository>(TYPES.ConfigsRepository)
    .to(ConfigsRepository)
    .inSingletonScope();
container
    .bind<IMessageRepository>(TYPES.MessageRepository)
    .to(MessageRepository)
    .inSingletonScope();
container
    .bind<IMembersRepository>(TYPES.MembersRepository)
    .to(MembersRepository)
    .inSingletonScope();
container
    .bind<IGroupMembersRepository>(TYPES.GroupMembersRepository)
    .to(GroupMembersRepository)
    .inSingletonScope();

container
    .bind<ITranscriptionService>(TYPES.TranscriptionService)
    .to(TranscriptionService);
container.bind<IResponseService>(TYPES.ResponseService).to(ResponseService);
container.bind<IAudioService>(TYPES.AudioService).to(AudioService);
container.bind<IApplication>(TYPES.Application).to(Application);

export { container };
