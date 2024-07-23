import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import { MongoClient } from "mongodb";
import { INumberPermissionRepository } from "../../application/contracts/INumberPermissionsRepository";
import { NumberPermission, NumberPermissions } from "../../application/dtos/numberPermission";

interface NumberPermissionsDocument {
    _id: string;
    desc: string;
    permissions: NumberPermission[];
}

@injectable()
export class NumberPermissionRepository implements INumberPermissionRepository {
    mongoClient: MongoClient;

    constructor(
        @inject(TYPES.MongoClient) mongoClient: MongoClient
    ) {
        this.mongoClient = mongoClient;
    }

    public async getAll(): Promise<NumberPermissions[]> {
        const collection = this.mongoClient
            .db("rap")
            .collection<NumberPermissionsDocument>("number_permissions");

        const results = await collection.find().toArray();

        return results.map((result) => ({
            id: result._id,
            desc: result.desc,
            permissions: result.permissions,
        }));
    };

    public async find(id: string): Promise<NumberPermissions | null> {
        const collection = this.mongoClient
            .db("rap")
            .collection<NumberPermissionsDocument>("number_permissions");

        var result = await collection.findOne({ _id: id });

        if (!result) {
            return null;
        }

        return {
            id: result._id,
            desc: result.desc,
            permissions: result.permissions,
        }
    };
}

