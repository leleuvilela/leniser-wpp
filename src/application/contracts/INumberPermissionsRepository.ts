import { NumberPermissions } from "../dtos/numberPermission";

export interface INumberPermissionRepository {
    getAll: () => Promise<NumberPermissions[]>;
    find(id: string): Promise<NumberPermissions | null>;
}
