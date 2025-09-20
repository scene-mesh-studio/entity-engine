import type { IEntityEnginePrimitive } from './engine';

export interface IEntityServletRequest {
    req: Request;
    endpoint: string;
    engine: IEntityEnginePrimitive;
}

export interface IEntityServletResponse {
    write(res: Response): void;
    read(): Response | undefined;
}

export interface IEntityServlet {
    path: string;
    methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
    handle: (req: IEntityServletRequest, res: IEntityServletResponse) => void;
}

export interface IEntityServletRegistry {
    register: (servlet: IEntityServlet) => void;
    unregister: (path: string) => void;
    get: (path: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE') => IEntityServlet | undefined;
}
