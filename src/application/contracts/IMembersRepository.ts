export interface Members {
    id: string;
    name: string;
}

export interface IMembersRepository {
    getMembers: () => Promise<Members[]>;
}
