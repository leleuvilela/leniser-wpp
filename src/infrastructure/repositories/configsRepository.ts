import { inject, injectable } from "inversify";
import { IConfigsRepository } from "../../application/contracts/IConfigsRepository";
import { MongoClient } from "mongodb";
import { TYPES } from "../../ioc/types";

interface ConfigsDocument {
    _id: string;
    imageCooldownEnabled: boolean;
    imageCooldownTime: number;
    systemPrompt: string;
    botPrefix: string;
    type: string;
}

@injectable()
export class ConfigsRepository implements IConfigsRepository {
    mongoClient: MongoClient;

    constructor(
        @inject(TYPES.MongoClient) mongoClient: MongoClient
    ) {
        this.mongoClient = mongoClient;
    }

    public async getConfigs() {
        const collection = this.mongoClient
            .db("rap")
            .collection<ConfigsDocument>("configs");

        const result = await collection.findOne({ type: "general" });

        if (!result) {
            throw new Error('CONFIGURATIONS IT IS NOT DEFINED ON DATABASE');
        }

        return {
            imageCooldownEnabled: result.imageCooldownEnabled,
            imageCooldownTime: result.imageCooldownTime,
            systemPrompt: result.systemPrompt,
            botPrefix: result.botPrefix,
        }
    }
}
