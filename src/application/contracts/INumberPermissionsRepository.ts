import { Member } from '../dtos/members';

export interface IMembersRepository {
    getAll: () => Promise<Map<string, Member>>;
    find(id: string): Promise<Member | null>;
    fetchAll(): Promise<Map<string, Member>>;
    create(member: Member): Promise<void>;
}
