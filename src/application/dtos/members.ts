import { MemberConfigs } from "../../infrastructure/repositories/membersRepository";

export interface Member {
    id: string;
    desc: string;
    permissions: MemberPermission[];
    configs: MemberConfigs;
}

export enum MemberPermission {
    MESSAGE_CREATE = 'MESSAGE_CREATE',
    MESSAGE_REVOKE = 'MESSAGE_REVOKE',
    SAVE_MESSAGE = 'SAVE_MESSAGE',
}

