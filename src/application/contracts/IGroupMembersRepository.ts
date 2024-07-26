import { GroupMembers } from "../dtos/groupMembers";

export interface IGroupMembersRepository {
    getMembers: (groupId: string) => Promise<GroupMembers | null>;
}
