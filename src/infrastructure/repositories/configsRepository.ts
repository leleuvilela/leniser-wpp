import { inject, injectable } from "inversify";
import { IConfigsRepository } from "../../application/contracts/IConfigsRepository";
import { MongoClient } from "mongodb";
import { TYPES } from "../../ioc/types";
import { Configs } from "../../application/dtos/configs";

interface ConfigsDocument {
    _id: string;
    imageCooldownEnabled: boolean;
    imageCooldownTime: number;
    systemPrompt: string;
    botPrefix: string;
    botNumber: string;
    type: string;
}

@injectable()
export class ConfigsRepository implements IConfigsRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient

    private configs: Configs;

    public async getConfigs() {
        if (!this.configs) {
            return await this.fetchConfigs();
        }

        return this.configs
    }

    public async fetchConfigs() {
        const collection = this.mongoClient
            .db("rap")
            .collection<ConfigsDocument>("configs");

        const result = await collection.findOne({ type: "general" });

        if (!result) {
            throw new Error('CONFIGURATIONS IT IS NOT DEFINED ON DATABASE');
        }

        const configs: Configs = {
            imageCooldownEnabled: result.imageCooldownEnabled,
            imageCooldownTime: result.imageCooldownTime,
            systemPrompt: result.systemPrompt,
            botPrefix: result.botPrefix,
            botNumber: result.botNumber,
        }

        this.configs = configs;

        return configs;
    }
}
