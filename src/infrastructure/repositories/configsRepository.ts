import { inject, injectable } from 'inversify';
import { IConfigsRepository } from '../../application/contracts/IConfigsRepository';
import { MongoClient } from 'mongodb';
import { TYPES } from '../../ioc/types';
import { Configs, ConfigType } from '../../application/dtos/configs';
import { Logger } from 'winston';

@injectable()
export class ConfigsRepository implements IConfigsRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient;
    @inject(TYPES.Logger) logger: Logger;

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
        this.logger.info('Configs Fetched');

        if (!result) {
            throw new Error('CONFIGURATIONS IT IS NOT DEFINED ON DATABASE');
        }

        this.defaultConfigs = result;

        return result;
    }
}
