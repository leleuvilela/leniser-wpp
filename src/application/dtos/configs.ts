import { MemberConfigs } from "./members";

export interface Configs {
    type: ConfigType;
    botNumber: string;
    defaultMemberConfigs: MemberConfigs
}

export enum ConfigType {
    GENERAL = "general",
}
