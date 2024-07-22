import { inject, injectable } from "inversify";
import { IAllowedNumbersRepository } from "../../application/contracts/IAllowedNumbersRepository";
import { TYPES } from "../../ioc/types";
import { MongoClient } from "mongodb";

export interface AllowedNumbers {
    id: string;
    desc: string;
}

@injectable()
export class AllowedNumbersRepository implements IAllowedNumbersRepository {
    allowedNumbers: AllowedNumbers[];
    mongoClient: MongoClient;

    constructor(
        @inject(TYPES.MongoClient) mongoClient: MongoClient
    ) {
        this.allowedNumbers = [];
        this.mongoClient = mongoClient;
    }

    public async getAllowedNumbers(): Promise<AllowedNumbers[]> {
        console.log('Getting allowed numbers')

        const collection = this.mongoClient.db("rap").collection("allowedNumbers");
        const results = await collection.find().toArray();

        this.allowedNumbers = results.map((result) => ({
            id: result.id,
            desc: result.desc,
        }));

        return this.allowedNumbers;
    };

    public isAllowed(id: string) {
        return !!this.allowedNumbers.find((allowedNumber) => allowedNumber.id === id)
    }
}

