import type { IEntityEnginePrimitiveInitializer } from '../../../core';

import { Auth } from '@auth/core';
import { createHash } from 'crypto';
import CredentialsProvider from '@auth/core/providers/credentials';

import { getDatabaseClient } from '../../database';
import { getEntityEnginePrimitive } from '../../../core/engine/engine.primitive';

/**
 * 处理认证相关请求
 * @param request 请求对象
 * @param props.init 实体引擎初始化参数
 * @param props.endpoint 可选的自定义端点路径，默认 /api/ee/auth
 * @returns 响应对象
 */
export async function fetchEntityAuthHandler(props: {
    request: Request;
    init: IEntityEnginePrimitiveInitializer;
    endpoint?: string;
}) {
    const engine = await getEntityEnginePrimitive(props.init);
    const db = await getDatabaseClient(engine.eventRegistry);

    const authOptions = {
        // 自定义基础路径；默认 @auth/core 解析的是 /api/auth/<action>，
        // 你当前实际入口为 /api/ee/auth/...，若不设置 basePath 会导致 UnknownAction。
        basePath: '/api/ee/auth',
        secret: process.env.AUTH_SECRET || '@scenemesh/entity-engine-secret',
        trustHost: true,
        pages: {
            // signIn: '/auth/login', // 自定义登录页路径
        },
        // 添加会话配置
        session: {
            strategy: 'jwt' as const,
            // 根据 rememberMe 动态设置过期时间
            maxAge: 30 * 24 * 60 * 60, // 默认30天
        },
        // 添加JWT配置
        jwt: {
            // JWT过期时间，会根据 rememberMe 在callbacks中动态调整
            maxAge: 30 * 24 * 60 * 60, // 默认30天
        },
        callbacks: {
            async jwt({ token, user }: { token: any; user?: any }) {
                // 首次登录时，将用户信息和rememberMe状态保存到token
                if (user) {
                    token.id = user.id;
                    token.rememberMe = (user as any).rememberMe;

                    // 根据rememberMe设置token过期时间
                    const rememberMe = (user as any).rememberMe;
                    if (rememberMe) {
                        // 记住我：30天
                        token.exp = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
                    } else {
                        // 不记住：1天
                        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
                    }
                }
                return token;
            },
            async session({ session, token }: { session: any; token: any }) {
                // 将token中的信息传递给session
                if (token) {
                    session.user.id = token.id as string;
                    (session as any).rememberMe = token.rememberMe;
                }
                return session;
            },
        },
        providers: [
            CredentialsProvider({
                name: 'Credentials',
                credentials: {
                    // 使用username而不是email作为字段名，这是NextAuth的标准
                    username: { label: 'Email', type: 'email', placeholder: 'demo@demo.com' },
                    password: { label: 'Password', type: 'password' },
                    rememberMe: { label: 'Remember Me', type: 'checkbox' },
                },
                async authorize(credentials) {
                    console.log('🔐 Auth attempt:', {
                        email: credentials?.username,
                        hasPassword: !!credentials?.password,
                    });

                    if (!credentials?.username || !credentials?.password) {
                        console.log('❌ Missing credentials');
                        return null;
                    }

                    // 正确创建MD5哈希
                    const hashedPassword = createHash('md5')
                        .update(credentials.password as string, 'utf8')
                        .digest('hex');

                    console.log('🔍 Searching for user with email:', credentials.username);

                    const user = await db.entityObject.findFirst({
                        where: {
                            modelName: 'ee-base-user',
                            isDeleted: false,
                            AND: [
                                {
                                    values: {
                                        path: ['email'],
                                        equals: credentials.username,
                                    },
                                },
                                {
                                    values: {
                                        path: ['password'],
                                        equals: hashedPassword,
                                    },
                                },
                            ],
                        },
                    });
                    if (user) {
                        console.log('✅ User found:', user.id);
                        const values = user.values as Record<string, any> | undefined;
                        const userData = {
                            id: user.id,
                            name: values?.userName || values?.email || 'Unnamed',
                            email: values?.email || '',
                            image: values?.avatar?.filePath || '',
                            rememberMe: credentials?.rememberMe || false,
                        };
                        console.log('👤 Returning user data:', userData);
                        return userData;
                    }

                    console.log('❌ No user found or password mismatch');
                    // return null;
                    throw new Error('Invalid credentials');
                },
            }),
        ],
    };

    try {
        const webResponse = await Auth(props.request, authOptions);

        const res = new Response(webResponse.body, {
            status: webResponse.status,
            headers: webResponse.headers,
        });

        return res;
    } catch (error: any) {
        // 捕获在 authorize 中抛出的错误
        console.error('Auth.js error caught:', error.message);

        // 如果是凭证错误，返回 401 Unauthorized 和一个 JSON body
        if (error.message === 'Invalid credentials') {
            // res.status(401).json({ error: "Invalid username or password" });
            return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            return new Response(JSON.stringify({ error: 'server internal error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }
}
