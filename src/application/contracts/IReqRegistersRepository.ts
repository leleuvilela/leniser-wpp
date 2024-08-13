import { ReqRegister, ReqRegisterType } from '../dtos/reqRegister';

export interface IReqRegistersRepository {
    getLastRegisterByAuthor: (
        authorId: string,
        type: ReqRegisterType
    ) => Promise<ReqRegister | null>;

    getLastRegisterByMember: (
        memberId: string,
        type: ReqRegisterType
    ) => Promise<ReqRegister | null>;

    addRegister: (reqRegister: ReqRegister) => Promise<void>;
}
