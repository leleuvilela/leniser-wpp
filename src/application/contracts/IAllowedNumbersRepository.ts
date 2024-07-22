import { AllowedNumbers } from "../../infrastructure/repositories/allowedNumbersRepository";

export interface IAllowedNumbersRepository {
    getAllowedNumbers: () => Promise<AllowedNumbers[]>;
    isAllowed: (id: string) => boolean;
}
