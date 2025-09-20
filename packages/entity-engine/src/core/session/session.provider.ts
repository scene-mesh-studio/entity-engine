import type {
    IEntitySession,
    EntitySessionData,
    IEntityEngineSettings,
    IEntitySessionProvider,
} from '../types'; // 复用之前的类型定义

import { queryClient } from '../../lib/query';

class DefaultEntitySession implements IEntitySession {
    #sessionData: EntitySessionData | undefined;
    #sessionId: string | undefined;
    #updateTime: number | undefined;

    #loadFn: () => Promise<EntitySessionData | undefined>;

    constructor(loadFn: () => Promise<EntitySessionData | undefined>) {
        this.#loadFn = loadFn;
    }

    isAuthenticated(): boolean {
        return !!this.#sessionData;
    }

    get sessionId(): string | undefined {
        return this.#sessionId;
    }

    get userInfo(): EntitySessionData | undefined {
        return this.#sessionData;
    }

    get updateTime(): number | undefined {
        return this.#updateTime;
    }

    async update(): Promise<void> {
        this.#sessionData = await this.#loadFn();
        this.#updateTime = new Date().getTime();
        this.#sessionId = this.#sessionData?.id;
        return Promise.resolve();
    }
}

export class DefaultEntitySessionProvider implements IEntitySessionProvider {
    #settings: IEntityEngineSettings;

    constructor(settings: IEntityEngineSettings) {
        this.#settings = settings;
    }

    get providerType(): string {
        return 'default';
    }

    async update(): Promise<void> {
        await queryClient.invalidateQueries({ queryKey: ['_session_'] }); // 立即重新获取
    }

    async session(): Promise<IEntitySession> {
        // const sessionData = await queryClient.fetchQuery<any | null>({
        //     queryKey: ['_session_'], // 必须和 useQuery 的 key 保持一致
        //     queryFn: fetchSessionFn,
        //     staleTime: 5 * 60 * 1000, // 5 分钟
        // });
        // console.log('sessionData', sessionData);
        // let userInfo: EntitySessionData | undefined = undefined;
        // if (sessionData?.user) {
        //     userInfo = {
        //         id: sessionData?.user?.email,
        //         email: sessionData?.user?.email,
        //         name: sessionData?.user?.name,
        //         avatar: sessionData?.user?.image,
        //         roles: sessionData?.user?.roles || [],
        //     };
        // }

        const fetchSessionFn = async (): Promise<EntitySessionData | null> => {
            const res = await fetch(
                this.#settings.getUrl('/auth/session') /*'/api/ee/auth/session'*/
            );
            if (res.ok) return res.json();
            return null;
        };

        const updateSessionFn = async () => {
            await queryClient.invalidateQueries({ queryKey: ['_session_'] });
            const data = await queryClient.fetchQuery<any | null>({
                queryKey: ['_session_'], // 必须和 useQuery 的 key 保持一致
                queryFn: fetchSessionFn,
                staleTime: 5 * 60 * 1000, // 5 分钟
            });
            console.log('update sessionData', data);
            let sd: EntitySessionData | undefined = undefined;
            if (data?.user) {
                sd = {
                    id: data?.user?.email,
                    email: data?.user?.email,
                    name: data?.user?.name,
                    avatar: data?.user?.image,
                    roles: data?.user?.roles || [],
                };
            }
            return sd;
        };

        const session = new DefaultEntitySession(updateSessionFn);
        await session.update();
        return session;
    }
}
