import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import { MongoClient } from "mongodb";
import { IMembersRepository } from "../../application/contracts/INumberPermissionsRepository";
import { MemberPermission, Member } from "../../application/dtos/members";

interface MembersDocument {
    id: string;
    desc: string;
    permissions: MemberPermission[];
    configs: MemberConfigs;
}

export interface MemberConfigs {
    imageCooldownEnabled?: boolean;
    imageCooldownTime: number;
    systemPrompt: string;
    botPrefix: string;
}

@injectable()
export class MembersRepository implements IMembersRepository {
    @inject(TYPES.MongoClient) mongoClient: MongoClient

    private members = new Map<string, Member>();

    public async getAll(): Promise<Map<string, Member>> {
        if (this.members) {
            return this.members;
        }

        return await this.fetchAll();
    };

    public async find(id: string): Promise<Member | null> {
        const member = this.members.get(id);

        if (member) {
            return member;
        }

        const collection = this.mongoClient
            .db("rap")
            .collection<MembersDocument>("members");

        const result = await collection.findOne({ id });

        if (!result) {
            return null;
        }

        const memberResult = {
            id: result.id,
            desc: result.desc,
            permissions: result.permissions,
            configs: result.configs
        }

        this.members.set(id, memberResult);

        return memberResult
    };

    public async fetchAll(): Promise<Map<string, Member>> {
        const collection = this.mongoClient
            .db("rap")
            .collection<MembersDocument>("members");

        const results = await collection.find().toArray();

        results.forEach((result) => {
            this.members.set(result.id, {
                id: result.id,
                desc: result.desc,
                permissions: result.permissions,
                configs: result.configs,
            })
        });

        return this.members;
    }
}

