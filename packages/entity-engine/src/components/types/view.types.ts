import type { ZodTypeAny } from 'zod';
import type { IEntityObject, EntityCSSProperties } from '../../types';
import type {
    IEntityViewDelegate,
    IEntityModelDelegate,
    IEntityViewFieldDelegate,
} from '../../core';

export type EntityViewBehaviorMode = 'display' | 'edit';

export type EntityViewBehaviorType = {
    mode?: EntityViewBehaviorMode;
    readonly?: boolean;
    disableEdit?: boolean;
    disableDelete?: boolean;
    disableNew?: boolean;
    toCreating?: boolean;
    toCreatingId?: string;
};

export type EntityViewCallbacksType = {
    onObjectDeleted?: (obj: IEntityObject) => void;
    onObjectCreated?: (obj: IEntityObject) => void;
    onObjectUpdated?: (obj: IEntityObject) => void;
};

export type EntityViewReferenceType = {
    fromModelName: string;
    fromFieldName: string;
    fromObjectId: string;
    toModelName: string;
};

export type EntityViewProps = {
    model: IEntityModelDelegate;
    viewData: IEntityViewDelegate;
    baseObjectId?: string;
    reference?: EntityViewReferenceType;
    behavior: EntityViewBehaviorType;
    callbacks?: EntityViewCallbacksType;
};

export interface IEntityViewMetaInfo {
    viewName: string;
    displayName: string;
    icon?: string;
    description?: string;
}

export abstract class EntityView<P extends EntityViewProps = EntityViewProps> {
    abstract readonly info: IEntityViewMetaInfo;

    abstract readonly Component: React.FC<P>;
}

/**
 * 封装由表单控制库（如 react-hook-form）注入的属性
 * @template TValue - 字段值的类型
 */
export type EntityWidgetFieldControlProps<TValue = any> = {
    name: string;
    value: TValue;
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    ref: React.Ref<any>;
};

/**
 * 封装由表单控制库注入的字段状态
 */
export type EntityWidgetFieldState = {
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    error?: {
        type: string;
        message?: string;
    };
};

export type EntityWidgetProps = {
    object?: IEntityObject;
    value: any;
    model: IEntityModelDelegate;
    view: IEntityViewDelegate;
    field: IEntityViewFieldDelegate;
    behavior: EntityViewBehaviorType;
    hasReference?: boolean;
    reference?: {
        referenceModel: IEntityModelDelegate;
        objectNum: number;
        object?: IEntityObject;
    };
    maintain?: EntityViewBehaviorType;
    options?: {
        [key: string]: any;
    };
    sx?: React.CSSProperties;

    fieldControl?: EntityWidgetFieldControlProps;
    fieldState?: EntityWidgetFieldState;
    style?: EntityCSSProperties;
    className?: string;
};

export interface IEntityWidgetMetaInfo {
    widgetName: string;
    displayName: string;
    icon?: string;
    description?: string;
}

export type EntityViewCapabilityDescriptor = {
    operators: Array<{
        name: string; // 如: record.getValues / record.setValue / collection.query / board.moveCard
        category?: string; // record | collection | board | action | custom
        inputSchema?: ZodTypeAny; // 可选 Zod -> JSON Schema
        outputSchema?: ZodTypeAny;
        description?: string;
        flags?: string[]; // async / mutating / streaming
    }>;
};

export interface IEntityViewController {
    modelName: string;
    viewType: string;
    viewId: string;
    describe(): EntityViewCapabilityDescriptor;
    invoke<T = any, R = any>(operator: string, input?: T): Promise<R>;
}

export abstract class EntityWidget<P extends EntityWidgetProps = EntityWidgetProps> {
    abstract readonly info: IEntityWidgetMetaInfo;

    abstract readonly Component: React.FC<P>;
}

export interface IEntityComponentSuiteAdapter {
    suiteName: string;

    suiteVersion: string;

    getWidget(widgetName: string): EntityWidget | undefined;

    getWidgets(): EntityWidget[];
}

export interface IEntityNamedRenderer {
    name: string;
    slotName?: string;
    disabled?: boolean;
    renderer: (props: any) => React.ReactNode;
}

export interface IEntityComponentRegistry {
    registerView(view: EntityView): void;

    registerViewLoader(viewName: string, loader: () => EntityView): void;

    getView(viewName: string): EntityView | undefined;

    getViews(): EntityView[];

    registerAdapter(adapter: IEntityComponentSuiteAdapter): void;

    getAdapter(suiteName: string): IEntityComponentSuiteAdapter | undefined;

    getAdapters(): IEntityComponentSuiteAdapter[];

    registerRenderer(renderer: IEntityNamedRenderer): void;

    getRenderer(name: string): IEntityNamedRenderer | undefined;

    getRenderersBySlot(slotName: string): IEntityNamedRenderer[];

    registerViewController(controller: IEntityViewController): void;

    unregisterViewController(viewId: string): void;

    getViewController(
        modelName?: string,
        viewType?: string,
        viewId?: string
    ): IEntityViewController | undefined;

    getAllViewControllers(): IEntityViewController[];
}
