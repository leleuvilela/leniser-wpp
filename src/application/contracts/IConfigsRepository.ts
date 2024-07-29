import { Configs } from '../dtos/configs';

export interface IConfigsRepository {
    getDefaultConfigs(): Promise<Configs>;
    fetchDefaultConfigs(): Promise<Configs>;
}
