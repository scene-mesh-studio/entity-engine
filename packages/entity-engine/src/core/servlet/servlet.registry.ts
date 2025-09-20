import type {
    IEntityServlet,
    IEntityServletRequest,
    IEntityEnginePrimitive,
    IEntityServletRegistry,
    IEntityServletResponse,
} from '../types';

export class EntityServletRequest implements IEntityServletRequest {
    req: Request;
    endpoint: string;
    engine: IEntityEnginePrimitive;

    constructor(req: Request, endpoint: string, engine: IEntityEnginePrimitive) {
        this.req = req;
        this.endpoint = endpoint;
        this.engine = engine;
    }
}

export class EntityServletResponse implements IEntityServletResponse {
    #response: Response | undefined = undefined;

    write(res: Response): void {
        this.#response = res;
    }
    read(): Response | undefined {
        return this.#response;
    }
}

export class EntityServletRegistry implements IEntityServletRegistry {
    private servlets: Map<string, IEntityServlet> = new Map();

    register(servlet: IEntityServlet): void {
        this.servlets.set(servlet.path, servlet);
    }

    unregister(path: string): void {
        this.servlets.delete(path);
    }

    get(path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE'): IEntityServlet | undefined {
        const servlet = this.servlets.get(path);
        if (servlet && servlet.methods.includes(method)) {
            return servlet;
        }
        return undefined;
    }
}
