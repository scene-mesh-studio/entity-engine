import type { IEntityEnginePrimitiveInitializer } from '../../core';

// 注意：不要从 '../api' barrel 导入，以避免将客户端代码打入服务端包
import { fetchEntityTrpcHandler } from '../api/trpc/trcp.handler';
import { fetchEntityAuthHandler } from '../api/auth/auth.handler';
import { getEntityEnginePrimitive } from '../../core/engine/engine.primitive';
import { fetchEntityUploadHandler } from '../api/utils/upload/upload.handler';
import { EntityServletRequest, EntityServletResponse } from '../../core/servlet';
import { fetchEntityServiceRequestHandler } from '../api/services/model.handler';

const EE_SERVICE_ROOT_PATH: string = process.env.EE_SERVICE_ROOT_PATH || '/api/ee';

export interface fetchEntityEntranceHandlerProps {
    request: Request;
    endpoint?: string;
    initializer: IEntityEnginePrimitiveInitializer;
}

export async function fetchEntityEntranceHandler(props: fetchEntityEntranceHandlerProps) {
    const { request, endpoint, initializer } = props;

    const SERVICE_ROOT_PATH = endpoint || EE_SERVICE_ROOT_PATH;

    const requestUrl = new URL(request.url);
    const requestPath = requestUrl.pathname;

    if (requestPath.startsWith(`${SERVICE_ROOT_PATH}/trpc`)) {
        return fetchEntityTrpcHandler({
            request,
            endpoint: `${SERVICE_ROOT_PATH}/trpc`,
            initializer,
        });
    }

    if (requestPath.startsWith(`${SERVICE_ROOT_PATH}/auth`)) {
        return fetchEntityAuthHandler({
            request,
            endpoint: `${SERVICE_ROOT_PATH}/auth`,
            init: initializer,
        });
    }

    if (requestPath.startsWith(`${SERVICE_ROOT_PATH}/utils/upload`)) {
        if (request.method === 'POST') {
            return fetchEntityUploadHandler(request);
        }
    }

    if (requestPath.startsWith(`${SERVICE_ROOT_PATH}/services`)) {
        return fetchEntityServiceRequestHandler({
            request,
            init: initializer,
            endpoint: `${SERVICE_ROOT_PATH}/services`,
        });
    }

    if (requestPath.startsWith(`${SERVICE_ROOT_PATH}/servlet`)) {
        const servletPath = requestPath.substring(`${SERVICE_ROOT_PATH}/servlet`.length) || '/';
        const slug = servletPath.split('/').filter(Boolean);
        console.log('Servlet request for path:', servletPath, 'parsed slug:', slug);
        if (slug.length > 0) {
            const [first, ...rest] = slug;
            const engine = await getEntityEnginePrimitive(initializer);
            if (engine) {
                const handler = engine.servletRegistry.get(`/${first}`, request.method as any);
                if (handler) {
                    const req = new EntityServletRequest(request, `/${rest.join('/')}`, engine);
                    const res = new EntityServletResponse();

                    try {
                        await handler.handle(req, res);
                    } catch (err) {
                        console.error(err);
                    }

                    const servletResponse = res.read();
                    if (servletResponse) {
                        return servletResponse;
                    }
                }
            }
        }
    }

    // Return a response based on the request handling
    return new Response(JSON.stringify({ message: 'Entity Engine Entrance' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
    });
}
