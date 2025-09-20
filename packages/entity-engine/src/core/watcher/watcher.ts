import type { IEntityView, IEntityModel } from '../../types';
import type { EntityView, EntityWidget, IEntityNamedRenderer } from '../../components';
import type {
    EntityEvent,
    IEntityEngine,
    IEntityModule,
    IEntityServlet,
    ImportEntityData,
    IEntityEngineWatcher,
    IEntityEventListener,
    IEntityActionHandler,
    IEntityEnginePrimitive,
} from '../types';

import { createId } from '@paralleldrive/cuid2';

import { BuildinModule } from '../../modules';
import { getDatabaseClient } from '../../services/database';

/**
 * EntityEngineWatcher
 *
 * 以单例方式提供的引擎生命周期观察者。未来如需在初始化前后插入逻辑，
 * 可在对应钩子内编写（例如：日志、性能计时、自动注册模块等）。
 */
export class EntityEngineWatcher implements IEntityEngineWatcher {
    private static _instance: EntityEngineWatcher | null = null;

    /** 私有构造，防止外部直接实例化 */
    private constructor() {}

    /**
     * 获取全局唯一实例（懒加载）
     */
    static getInstance(): EntityEngineWatcher {
        if (!this._instance) {
            this._instance = new EntityEngineWatcher();
        }
        return this._instance;
    }

    /**
     * 允许在测试或特殊场景下替换单例实例
     */
    static setInstance(instance: EntityEngineWatcher) {
        this._instance = instance;
    }

    async onEntityEngineBeforeInit(args: {
        engine: IEntityEnginePrimitive | IEntityEngine;
        clientSide: boolean;
    }): Promise<void> {
        const engine = args.engine;
        engine.moduleRegistry.registerModule(new BuildinModule(), args.clientSide);
        console.log('>>>>>>>>>>>> EntityEngineWatcher: onEntityEngineBeforeInit called');
    }

    async onEntityEngineAfterInit(_args: {
        engine: IEntityEnginePrimitive | IEntityEngine;
        clientSide: boolean;
    }): Promise<void> {
        console.log('>>>>>>>>>>>> EntityEngineWatcher: onEntityEngineAfterInit called');

        const engine = _args.engine;
        const isClient = _args.clientSide;

        // 应用模块
        await applyModules(engine, isClient);

        // 检查/加载 配置内容
        if (!isClient) {
            // await checkAndLoadConfigs(engine);
        } else {
            await checkAndLoadConfigsFromServer(engine);
        }
    }
}

async function checkAndLoadConfigsFromServer(engine: IEntityEngine | IEntityEnginePrimitive) {
    console.log('>>>>>>>>>>>> EntityEngineWatcher: checkAndLoadConfigsFromServer called');

    const datasource = engine.datasourceFactory.getDataSource();
    const config = await datasource.findPlainConfig({});
    if (config) {
        engine.metaRegistry.updateOrRegisterByPlainObject(config);
    }
    console.log(
        '###########>>>>>>>>>>>> EntityEngineWatcher: Loaded config from server datasource models:',
        engine.metaRegistry.models.length,
        'views:',
        engine.metaRegistry.views.length
    );
}

async function checkAndLoadConfigs(engine: IEntityEngine | IEntityEnginePrimitive) {
    console.log('>>>>>>>>>>>> EntityEngineWatcher: checkAndLoadConfigs called');

    const client = await getDatabaseClient(engine.eventRegistry);

    const eobj = await client.entityObject.findFirst({
        where: {
            modelName: '__config__',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const currentConfigJsonString = engine.metaRegistry.toJSONString();
    if (eobj) {
        let existConfigJsonString = null;
        const values = eobj.values;
        if (typeof values === 'object' && values !== null && !Array.isArray(values)) {
            existConfigJsonString = values?.content;
        }

        if (existConfigJsonString !== currentConfigJsonString) {
            await client.entityObject.create({
                data: {
                    id: createId(),
                    modelName: '__config__',
                    values: {
                        content: currentConfigJsonString,
                    },
                    isDeleted: false,
                },
            });
        }

        // test for load config from db
        // engine.metaRegistry.cleanup();
        if (existConfigJsonString && typeof existConfigJsonString === 'string') {
            engine.metaRegistry.fromJSONString(existConfigJsonString);
            console.log('>>>>>>>>>>>> [TEST] EntityEngineWatcher: Loaded config from database');
        }
    } else {
        await client.entityObject.create({
            data: {
                id: createId(),
                modelName: '__config__',
                values: {
                    content: currentConfigJsonString,
                },
                isDeleted: false,
            },
        });
    }
}

async function applyModules(engine: IEntityEngine | IEntityEnginePrimitive, isClient: boolean) {
    console.log('>>>>>>>>>>>> EntityEngineWatcher: applyModules called');
    const modules = engine.moduleRegistry.getAllModules();
    if (modules) {
        for (const module of modules) {
            try {
                const ms: IEntityModel[] = [];
                const vs: IEntityView[] = [];
                const ahs: IEntityActionHandler[] = [];
                const ehs: {
                    focusEventNames: string[];
                    handler: IEntityEventListener<EntityEvent>;
                }[] = [];
                const servs: IEntityServlet[] = [];
                await module.setupConfig({
                    models: ms,
                    views: vs,
                    eventHandlers: ehs,
                    actionHandlers: ahs,
                    servlets: servs,
                });
                for (const m of ms) {
                    engine.metaRegistry.registerModel(m);
                }
                for (const v of vs) {
                    engine.metaRegistry.registerView(v);
                }
                for (const eh of ehs) {
                    for (const eventName of eh.focusEventNames) {
                        console.log(
                            '################## register event listener',
                            eventName,
                            eh.handler,
                            module.info.name
                        );
                        engine.eventRegistry.registerListener(eventName, eh.handler);
                    }
                }
                for (const ah of ahs) {
                    engine.actionRegistry.registerActionHandler(ah);
                }
                for (const sv of servs) {
                    engine.servletRegistry.register(sv);
                }
                if (!isClient) {
                    await initModuleData(engine, module, isClient);
                }
            } catch (e) {
                console.error(e);
            }

            if (isClient) {
                const clientEngine = engine as IEntityEngine;
                try {
                    const views: EntityView[] = [];
                    const widgets: EntityWidget[] = [];
                    const renderers: IEntityNamedRenderer[] = [];
                    await module.setupComponents({ views, widgets, renderers });
                    for (const v of views) {
                        clientEngine.componentRegistry.registerView(v);
                    }
                    // for(const w of widgets){
                    //     engine.componentRegistry.registerWidget(w);
                    // }
                    for (const r of renderers) {
                        clientEngine.componentRegistry.registerRenderer(r);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
}

async function initModuleData(
    engine: IEntityEngine | IEntityEnginePrimitive,
    module: IEntityModule,
    isClient: boolean
): Promise<void> {
    console.log('>>>>>>>>>>>> EntityEngineWatcher: initModuleData called');
    const client = await getDatabaseClient(engine.eventRegistry);
    const initData: ImportEntityData[] = [];
    await module.setupData({ entities: initData });
    if (initData.length > 0 && !isClient) {
        // 2. 准备要创建的数据
        const entitiesToUpsert = initData.map((item) => ({
            id: item.id,
            modelName: item.modelName,
            values: item.values,
        }));

        const referencesToCreate: any[] = [];
        initData.forEach((fromObject) => {
            if (fromObject.references && fromObject.references.length > 0) {
                fromObject.references.forEach((ref) => {
                    // 找到被引用的对象以获取其 modelName
                    const toObject = initData.find((item) => item.id === ref.toObjectId);
                    if (!toObject) {
                        console.warn(
                            `警告：在 id 为 '${fromObject.id}' 的对象中找不到引用的 toObjectId: '${ref.toObjectId}'`
                        );
                        return;
                    }

                    referencesToCreate.push({
                        fromFieldName: ref.fromFieldName,
                        fromModelName: fromObject.modelName,
                        fromObjectId: fromObject.id,
                        toModelName: toObject.modelName,
                        toObjectId: ref.toObjectId,
                    });
                });
            }
        });
        // 在这里处理初始化数据
        try {
            await client.$transaction(async (tx) => {
                // 为了避免重复导入错误，您可以选择在这里先清空旧数据
                // console.log('清空旧数据...');
                // await tx.entityObjectReference.deleteMany({});
                // await tx.entityObject.deleteMany({});

                // 批量创建 EntityObject
                console.log(`正在创建 ${entitiesToUpsert.length} 个实体...`);
                await tx.entityObject.createMany({
                    data: entitiesToUpsert,
                    skipDuplicates: true, // 如果 id 已存在，则跳过
                });

                // 批量创建 EntityObjectReference
                if (referencesToCreate.length > 0) {
                    console.log(`正在创建 ${referencesToCreate.length} 个实体关系...`);
                    await tx.entityObjectReference.createMany({
                        data: referencesToCreate,
                        skipDuplicates: true, // 根据索引跳过重复项
                    });
                }
            });
            console.log(`✅ [Module:${module.info.name}]数据导入成功！`);
        } catch (error) {
            console.error(`❌ [Module:${module.info.name}]数据导入失败:`, error);
        }
    }
}

/**
 * 导出单例实例，常规使用场景直接引入此对象即可。
 * 例如：import { entityEngineWatcher } from '...';
 */
export const entityEngineWatcher: IEntityEngineWatcher = EntityEngineWatcher.getInstance();
