export interface IApplication {
    start(): Promise<void>;
    updateConfigs(): Promise<void>;
}
