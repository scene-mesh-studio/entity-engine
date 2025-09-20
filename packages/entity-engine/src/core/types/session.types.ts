export type EntitySessionData = {
    readonly email: string;
    readonly name: string;
    readonly avatar?: string;
    readonly roles?: string[];
    readonly id: string;
};

export interface IEntitySession {
    isAuthenticated: () => boolean;
    update(): void;
    readonly sessionId?: string;
    readonly userInfo?: EntitySessionData;
    readonly updateTime?: number;
}

export class EntitySession implements IEntitySession {
    constructor(
        public readonly sessionId?: string,
        public readonly userInfo?: EntitySessionData,
        public readonly update: () => void = () => {}
    ) {}
    isAuthenticated(): boolean {
        return !!this.userInfo;
    }
}

export interface IEntitySessionProvider {
    get providerType(): string;
    session(): Promise<IEntitySession>;
}

export interface IEntitySessionManager {
    setProvider(provider: IEntitySessionProvider): void;
    getProvider(): IEntitySessionProvider | undefined;

    getSession(): Promise<IEntitySession>;
}
