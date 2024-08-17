import { inject, injectable } from 'inversify';
import { MongoClient } from 'mongodb';
import { TYPES } from '../../ioc/types';
import { IReqRegistersRepository } from '../../application/contracts/IReqRegistersRepository';
import { ReqRegister, ReqRegisterType } from '../../application/dtos/reqRegister';
import { Logger } from 'winston';

@injectable()
export class ReqRegistersRepository implements IReqRegistersRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;
    @inject(TYPES.Logger) logger: Logger;

    private collectionName = 'req_registers';

    public async getLastRegisterByAuthor(authorId: string, type: ReqRegisterType) {
        const collection = this.mongoClient
            .db('rap')
            .collection<ReqRegister>(this.collectionName);

        const result = await collection.findOne(
            {
                authorId,
                type,
            },
            {
                sort: { timestamp: -1 },
            }
        );
        this.logger.info('Last Register by Author Fetched');

        return result;
    }

    public async getLastRegisterByMember(memberId: string, type: ReqRegisterType) {
        const collection = this.mongoClient
            .db('rap')
            .collection<ReqRegister>(this.collectionName);

        const result = await collection.findOne(
            {
                memberId,
                type,
            },
            {
                sort: { timestamp: -1 },
            }
        );
        this.logger.info('Last Register by Member Fetched');

        return result;
    }

    public async addRegister(reqRegister: ReqRegister) {
        const collection = this.mongoClient
            .db('rap')
            .collection<ReqRegister>(this.collectionName);

        await collection.insertOne(reqRegister);
        this.logger.info('Register created');
    }
}
