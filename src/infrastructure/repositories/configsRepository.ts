import { inject, injectable } from 'inversify';
import { IConfigsRepository } from '../../application/contracts/IConfigsRepository';
import { MongoClient } from 'mongodb';
import { TYPES } from '../../ioc/types';
import { Configs, ConfigType } from '../../application/dtos/configs';

@injectable()
export class ConfigsRepository implements IConfigsRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;

    private defaultConfigs: Configs;

    public async getDefaultConfigs() {
        if (!this.defaultConfigs) {
            return await this.fetchDefaultConfigs();
        }

        return this.defaultConfigs;
    }

    public async fetchDefaultConfigs() {
        const collection = this.mongoClient.db('rap').collection<Configs>('configs');

        const result = await collection.findOne({ type: ConfigType.GENERAL });

        if (!result) {
            throw new Error('CONFIGURATIONS IT IS NOT DEFINED ON DATABASE');
        }

        this.defaultConfigs = result;

        return result;
    }
}
