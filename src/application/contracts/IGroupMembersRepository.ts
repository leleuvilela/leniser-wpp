import { GroupMembers } from "../dtos/members";

export interface IGroupMembersRepository {
    getMembers: (groupId: string) => Promise<GroupMembers | null>;
}
