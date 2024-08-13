import { Container } from 'inversify';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import { Client } from 'whatsapp-web.js';
import { Application } from '../app';
import { IApplication } from '../application/contracts/IApplication';
import { IAudioService } from '../application/contracts/IAudioService';
import { IHandler } from '../application/contracts/IHandler';
import { IMessageRepository } from '../application/contracts/IMessagesRepository';
import { IResponseService } from '../application/contracts/IResponseService';
import { BotHandler } from '../application/events/bot';
import { FalaHandler } from '../application/events/fala';
import { RankingHandler } from '../application/events/ranking';
import { MensagensPorDiaHandler } from '../application/events/mensagensPorDia';
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
import { MenuHandler } from '../application/events/menu';
import { AaHandler } from '../application/events/aa';
import { ChecagemHandler } from '../application/events/checagem';
import { VaiNeleHandler } from '../application/events/vaiNele';
import { PingHandler } from '../application/events/ping';
import { StickerHandler } from '../application/events/sticker';
import { ImagemHandler } from '../application/events/imagem';
import { Mp3Handler } from '../application/events/mp3';
import { GroupJoinListener } from '../application/listeners/groupJoin';
import { IImgflipService } from '../application/contracts/IImgflipService';
import { ImgflipService } from '../infrastructure/services/imgflipService';
import { AiMemeHandler } from '../application/events/aimeme';
import { MemeHandler } from '../application/events/meme';
import { MusicHandler } from '../application/events/music';
import { IMusicService } from '../application/contracts/IMusicService';
import { MusicService } from '../infrastructure/services/musicService';
import { ResumoHandler } from '../application/events/resumo';

const container = new Container();

container.bind<OpenAI>(TYPES.OpenAIClient).toConstantValue(openaiClient);
container.bind<MongoClient>(TYPES.MongoClient).toConstantValue(mongoClient);
container.bind<Client>(TYPES.WwebClient).toConstantValue(wwebClient);

container.bind(TYPES.MessageObserver).to(MessageObserver);

container.bind<IListener>(TYPES.AuthenticationListener).to(AuthenticationListener);
container.bind<IListener>(TYPES.MessageCreateListener).to(MessageCreateListener);
container.bind<IListener>(TYPES.MessageRevokeListener).to(MessageRevokeListener);
container.bind<IListener>(TYPES.GroupJoinListener).to(GroupJoinListener);

container.bind<IHandler>(TYPES.BotHandler).to(BotHandler);
container.bind<IHandler>(TYPES.FalaHandler).to(FalaHandler);
container.bind<IHandler>(TYPES.RankingHandler).to(RankingHandler);
container.bind<IHandler>(TYPES.MensagensPorDiaHandler).to(MensagensPorDiaHandler);
container.bind<IHandler>(TYPES.TranscreverHandler).to(TranscreverHandler);
container.bind<IHandler>(TYPES.DeuitaHandler).to(DeuitaHandler);
container.bind<IHandler>(TYPES.GilsoHandler).to(GilsoHandler);
container.bind<IHandler>(TYPES.MenuHandler).to(MenuHandler);
container.bind<IHandler>(TYPES.AaHandler).to(AaHandler);
container.bind<IHandler>(TYPES.ChecagemHandler).to(ChecagemHandler);
container.bind<IHandler>(TYPES.VaiNeleHandler).to(VaiNeleHandler);
container.bind<IHandler>(TYPES.PingHandler).to(PingHandler);
container.bind<IHandler>(TYPES.StickerHandler).to(StickerHandler);
container.bind<IHandler>(TYPES.ImagemHandler).to(ImagemHandler);
container.bind<IHandler>(TYPES.Mp3Handler).to(Mp3Handler);
container.bind<IHandler>(TYPES.AiMemeHandler).to(AiMemeHandler);
container.bind<IHandler>(TYPES.MemeHandler).to(MemeHandler);
container.bind<IHandler>(TYPES.MusicHandler).to(MusicHandler);
container.bind<IHandler>(TYPES.ResumoHandler).to(ResumoHandler);

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
container.bind<IImgflipService>(TYPES.ImgflipService).to(ImgflipService);
container.bind<IMusicService>(TYPES.MusicService).to(MusicService);

container.bind<IApplication>(TYPES.Application).to(Application);

export { container };
