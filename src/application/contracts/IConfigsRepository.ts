import { Configs } from "../dtos/configs";

export interface IConfigsRepository {
    getConfigs(): Promise<Configs>
    fetchConfigs(): Promise<Configs>
}
