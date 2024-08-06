import { MongoClient } from 'mongodb';
import { IMessageRepository } from '../../application/contracts/IMessagesRepository';
import { MessageCountDto } from '../../application/dtos/messageCountDto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';
import { IMessage } from '../../application/dtos/message';

@injectable()
export class MessageRepository implements IMessageRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;

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
            const collection = db.collection('messages');

            const threeHours = 60 * 60 * 3;

            const startDateInSeconds =
                Math.floor(startDate.getTime() / 1000) + threeHours;
            const endDateInSeconds = Math.floor(endDate.getTime() / 1000) + threeHours;

            const pipeline = [
                {
                    $match: {
                        timestamp: {
                            $gte: startDateInSeconds,
                            $lte: endDateInSeconds,
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
            console.error('Error fetching message counts by user:', error);
            return [];
        }
    }
}
