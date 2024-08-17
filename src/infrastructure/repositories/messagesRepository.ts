import { MongoClient } from 'mongodb';
import { IMessageRepository } from '../../application/contracts/IMessagesRepository';
import { MessageCountDto } from '../../application/dtos/messageCountDto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IMessage } from '../../application/dtos/message';
import { Message } from 'whatsapp-web.js';
import { toDateOnlyString } from '../../utils/dateExtensions';
import { Logger } from 'winston';

@injectable()
export class MessageRepository implements IMessageRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;
    @inject(TYPES.Logger) logger: Logger;

    async addFullMessage(msg: Message): Promise<boolean> {
        const result = await this.mongoClient
            .db('rap')
            .collection('messages')
            .insertOne(msg);

        return result.acknowledged;
    }

    async addMessage(msg: IMessage): Promise<boolean> {
        const result = await this.mongoClient
            .db('rap')
            .collection('new-messages')
            .insertOne(msg);

        return result.acknowledged;
    }

    async getMessageCountsByUser(
        startDate: Date,
        endDate: Date,
        groupId: string
    ): Promise<MessageCountDto[]> {
        try {
            const db = this.mongoClient.db('rap');
            const collection = db.collection('new-messages');

            const startDay = toDateOnlyString(startDate.getTime());
            const endDay = toDateOnlyString(endDate.getTime());

            const pipeline = [
                {
                    $match: {
                        day: {
                            $gte: startDay,
                            $lte: endDay,
                        },
                        from: groupId,
                    },
                },
                { $group: { _id: '$author', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ];

            const results = await collection.aggregate(pipeline).toArray();

            return results.map(
                (result) =>
                    ({
                        id: result._id as string,
                        count: result.count as number,
                    }) as MessageCountDto
            );
        } catch (error) {
            this.logger.error('Error fetching message counts by user:', error);
            return [];
        }
    }

    async getMessageCountsByDay(
        endDate: Date,
        groupId: string
    ): Promise<MessageCountDto[]> {
        try {
            const db = this.mongoClient.db('rap');
            const collection = db.collection('new-messages');

            const endDay = toDateOnlyString(endDate.getTime());

            const pipeline = [
                {
                    $match: {
                        day: {
                            $lte: endDay,
                        },
                        from: groupId,
                    },
                },
                { $group: { _id: '$day', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ];

            const results = await collection.aggregate(pipeline).toArray();

            return results.map(
                (result) =>
                    ({
                        id: result._id as string,
                        count: result.count as number,
                    }) as MessageCountDto
            );
        } catch (error) {
            this.logger.error('Error fetching message counts by user:', error);
            return [];
        }
    }
}
