import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import { MongoClient } from "mongodb";
import { GroupMembers } from "../../application/dtos/groupMembers";
import { IGroupMembersRepository } from "../../application/contracts/IGroupMembersRepository";

export interface MembersDocument {
    _id: string;
    members: Record<string, string>;
}

@injectable()
export class GroupMembersRepository implements IGroupMembersRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient

    public async getMembers(groupId: string): Promise<GroupMembers | null> {
        const collection = this.mongoClient
            .db("rap")
            .collection<MembersDocument>("group_members");

        const result = await collection.findOne({ _id: groupId });

        if (!result) {
            return null;
        }

        return {
            group_id: result._id,
            members: result.members,
        }
    }
}
