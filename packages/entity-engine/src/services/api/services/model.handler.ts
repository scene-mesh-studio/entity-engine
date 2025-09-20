// import { NextResponse, type NextRequest } from 'next/server';

import type { IEntityEnginePrimitiveInitializer } from '../../../core';

import { createModelContext } from './model.context';
import {
    findObjectLogic,
    type ApiContext,
    listObjectsLogic,
    listObjectsInputSchema,
    findOneWithReferencesLogic,
} from './model.service';

interface fetchEntityRequestHandlerProps {
    request: Request;
    endpoint?: string;
    init?: IEntityEnginePrimitiveInitializer;
}

interface fetchContext {
    serviceContext: ApiContext;
    request: Request;
    slug: string[] | undefined;
}

class fetchResponse {
    private _jsonData: any;
    private _statusCode: number;
    private _message: string | undefined;
    constructor() {
        this._jsonData = undefined;
        this._message = undefined;
        this._statusCode = 200;
    }
    json(data: any) {
        this._jsonData = data;
        return this;
    }
    status(statusCode: number) {
        this._statusCode = statusCode;
        return this;
    }
    message(message: string) {
        this._message = message;
        return this;
    }
    get jsonData() {
        return this._jsonData;
    }

    get statusCode() {
        return this._statusCode;
    }

    get msg() {
        return this._message;
    }
}

export async function fetchEntityServiceRequestHandler(props: fetchEntityRequestHandlerProps) {
    const { request, endpoint, init } = props;
    const ctx = await createModelContext(init);

    const url = new URL(request.url);
    const pathName = endpoint ? url.pathname.replace(endpoint, '') : url.pathname;
    const pathSegments = pathName.split('/');
    console.log('fetchEntityServiceRequestHandler: ', pathSegments);
    if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1] === '') {
        pathSegments.pop();
    }
    //    - slice(2) 是因为要跳过开头的 '' 和 'api'
    const slug = pathSegments.length > 2 ? pathSegments.slice(1) : undefined;
    console.log('fetchEntityServiceRequestHandler slug: ', slug);

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const context: fetchContext = {
        serviceContext: ctx,
        request,
        slug,
    };

    const response: fetchResponse = new fetchResponse();

    if (!slug || slug.length === 0) {
        // 访问根路径
        await handleEngineInfoRequest(context, response);
    } else if (slug[0] === 'meta' && slug.length >= 2) {
        // /meta/*
        if (slug[1] === 'models') {
            // /meta/models/
            // /meta/models/{modelName}
            await handleMetaModelsRequest(context, response);
        } else if (slug[1] === 'views') {
            // /meta/views/
            // /meta/views/{viewName}
            await handleMetaViewsRequest(context, response);
        } else if (slug[1] === 'update') {
            // /meta/update
            if (request.method === 'POST') {
                await handleMetaUpdateRequest(context, response);
            }
        }
    } else if (slug[0] === 'objects' && slug.length >= 2) {
        // /objects/{modelName}
        await handleObjectsRequest(context, response);
    } else if (slug[0] === 'object' && slug.length >= 2) {
        // /object/{objectId}
        await handleObjectRequest(context, response);
    }

    const data = {
        target: {
            path: url.pathname,
            method: request.method,
        },
        result: response.jsonData,
        success: response.statusCode === 200,
        ...(response.msg && { message: response.msg }),
    };

    return Response.json(data, { headers });
}

async function handleEngineInfoRequest(context: fetchContext, response: fetchResponse) {
    const { serviceContext, request, slug } = context;

    response.json({
        name: 'entity engine',
        version: '0.0.1',
        createTime: serviceContext.engine.createTime,
        models: serviceContext.engine.metaRegistry.models.length,
        views: serviceContext.engine.metaRegistry.views.length,
    });
}
async function handleMetaModelsRequest(context: fetchContext, response: fetchResponse) {
    const { serviceContext, request, slug } = context;

    if (slug && slug?.length > 2) {
        const modelName = slug[2];
        const m = serviceContext.engine.metaRegistry.getModel(modelName);
        response.json(m ? serviceContext.engine.metaRegistry.toPlainModelObject(m) : null);
    } else {
        const models = [];
        for (const model of serviceContext.engine.metaRegistry.models) {
            models.push(serviceContext.engine.metaRegistry.toPlainModelObject(model));
        }
        response.json(models);
    }
}

async function handleMetaUpdateRequest(context: fetchContext, response: fetchResponse) {
    const { serviceContext, request, slug } = context;

    const body = await request.json();
    const { models, views } = body;

    serviceContext.engine.metaRegistry.updateOrRegisterByPlainObject({
        models: models || [],
        views: views || [],
    });

    response.json({ message: 'Meta updated successfully' });
}

async function handleMetaViewsRequest(context: fetchContext, response: fetchResponse) {
    const { serviceContext, request, slug } = context;

    if (slug && slug?.length > 2) {
        const viewName = slug[2];
        const view = serviceContext.engine.metaRegistry.getView(viewName);
        if (view) {
            // response.json({
            //     name: view.name,
            //     title: view.title,
            //     description: view.description,
            //     modelName: view.modelName,
            //     viewType: view.viewType,
            //     viewOptions: view.viewOptions,
            //     canEdit: view.canEdit,
            //     canNew: view.canNew,
            //     canDelete: view.canDelete,
            //     density: view.density,
            //     items: view.items,
            //     hilites: view.hilites,
            // });
            response.json(serviceContext.engine.metaRegistry.toPlainViewObject(view));
        }
    } else {
        response.json(
            // serviceContext.engine.metaRegistry.views.map((view) => ({
            //     name: view.name,
            //     title: view.title,
            //     description: view.description,
            //     modelName: view.modelName,
            //     viewType: view.viewType,
            //     viewOptions: view.viewOptions,
            //     canEdit: view.canEdit,
            //     canNew: view.canNew,
            //     canDelete: view.canDelete,
            //     density: view.density,
            //     items: view.items,
            //     hilites: view.hilites,
            // }))
            serviceContext.engine.metaRegistry.views.map((view) =>
                serviceContext.engine.metaRegistry.toPlainViewObject(view)
            )
        );
    }
}
async function handleObjectsRequest(context: fetchContext, response: fetchResponse) {
    const { request, serviceContext, slug } = context;
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const modelName = slug && slug[1];
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10', 10);
    const withReference = searchParams.get('withReference') === 'true';
    const refModelName = searchParams.get('fromModelName');
    const refFieldName = searchParams.get('fromFieldName');
    const refObjectId = searchParams.get('fromObjectId');

    const inputForValidation = {
        modelName,
        pagination: {
            ...(page && { page }),
            ...(pageSize && { pageSize }),
        },
        ...(refModelName &&
            refFieldName &&
            refObjectId && {
                reference: {
                    fromModelName: refModelName,
                    fromFieldName: refFieldName,
                    fromObjectId: refObjectId,
                },
            }),
    };

    const validation = listObjectsInputSchema.safeParse(inputForValidation);
    if (!validation.success) {
        response.status(400).message('Invalid query parameters');
        return;
    }
    // slug[1] should be the modelName
    if (!modelName) {
        response.status(400).message('Model name is required in the path.');
        return;
    }

    if (withReference) {
        const ret = await listObjectsLogic(serviceContext, validation.data);
        const data = [];
        if (ret && ret.data && ret.data.length > 0) {
            for (const obj of ret.data) {
                const objWithRef = await findOneWithReferencesLogic(serviceContext, {
                    objectId: obj.id,
                });
                if (objWithRef) {
                    data.push(objWithRef);
                }
            }
        }
        response.json({
            data,
            pagination: {
                page,
                pageSize,
                count: ret.count,
                pageCount: Math.ceil(ret.count / pageSize),
            },
        });
    } else {
        const ret = await listObjectsLogic(serviceContext, validation.data);
        response.json({
            data: ret.data,
            pagination: {
                page,
                pageSize,
                count: ret.count,
                pageCount: Math.ceil(ret.count / pageSize),
            },
        });
    }
}

async function handleObjectRequest(context: fetchContext, response: fetchResponse) {
    const { request, serviceContext, slug } = context;
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const objectId = slug && slug[1];
    const withReference = searchParams.get('withReference') === 'true';
    const includeFieldNamesStr = searchParams.get('includeFieldNames');
    const includeFieldNames = includeFieldNamesStr ? includeFieldNamesStr.split(',') : undefined;

    if (objectId) {
        if (withReference) {
            const ret = await findOneWithReferencesLogic(serviceContext, {
                objectId,
                ...(includeFieldNames && { includeFieldNames }),
            });
            if (ret) {
                response.json(ret);
            } else {
                response.status(404).message('Object not found');
            }
        } else {
            console.log('objectId', objectId);
            const ret = await findObjectLogic(serviceContext, { id: objectId });
            if (ret) {
                response.json(ret);
            } else {
                response.status(404).message('Object not found');
            }
        }
    } else {
        response.status(400).message('Object id is required in the path.');
    }
}
