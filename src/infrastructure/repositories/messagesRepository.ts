import { MongoClient } from "mongodb";
import { Message } from "whatsapp-web.js";
import { IMessageRepository } from "../../application/contracts/IMessagesRepository";
import { MessageCountDto } from "../../application/dtos/messageCountDto";
import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";

@injectable()
export class MessageRepository implements IMessageRepository {
    client: MongoClient;

    constructor(
        @inject(TYPES.MongoClient) mongoClient: MongoClient
    ) {
        this.client = mongoClient;
    }

    async addMessage(msg: Message): Promise<boolean> {
        if (!this.client) {
            return true;
        }

        const result = await this.client.db("rap").collection("messages").insertOne(msg);

        return result.acknowledged
    }

    async getMessageCountsByUser(startDate: Date, endDate: Date): Promise<MessageCountDto[]> {
        try {
            if (!this.client) {
                return [];
            }

            const db = this.client.db("rap");
            const collection = db.collection("messages");

            const pipeline = [
                {
                    $match: {
                        timestamp: {
                            $gte: Math.floor(startDate.getTime() / 1000),
                            $lte: Math.floor(endDate.getTime() / 1000)
                        }
                    }
                },
                { $group: { _id: "$author", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ];

            const results = await collection
                .aggregate(pipeline)
                .toArray();

            return results.map((result) => ({
                name: result._id as string,
                count: result.count as number,
            } as MessageCountDto));

        } catch (error) {
            console.error("Error fetching message counts by user:", error);
            return [];
        }
    }
}
