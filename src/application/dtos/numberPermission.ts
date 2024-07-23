export interface NumberPermissions {
    id: string;
    desc: string;
    permissions: NumberPermission[];
}

export enum NumberPermission {
    MESSAGE_CREATE = 'MESSAGE_CREATE',
    MESSAGE_REVOKE = 'MESSAGE_REVOKE',
    SAVE_MESSAGE = 'SAVE_MESSAGE',
}

