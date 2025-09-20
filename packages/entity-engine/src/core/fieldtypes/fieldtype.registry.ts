import type { IModelFieldTyper } from '../../types';
import type { IModelFieldTyperRegistry } from '../types';

import {
    DateFieldTyper,
    EnumFieldTyper,
    JsonFieldTyper,
    ArrayFieldTyper,
    NumberFieldTyper,
    StringFieldTyper,
    BinaryFieldTyper,
    BooleanFieldTyper,
    OneToOneFieldTyper,
    ManyToOneFieldTyper,
    OneToManyFieldTyper,
    ManyToManyFieldTyper,
} from '../../build-ins';

export class ModelFieldTyperRegistry implements IModelFieldTyperRegistry {
    private _fieldTypes: Map<string, IModelFieldTyper> = new Map();

    constructor() {
        this.registerFieldTyper(new StringFieldTyper());
        this.registerFieldTyper(new NumberFieldTyper());
        this.registerFieldTyper(new BooleanFieldTyper());
        this.registerFieldTyper(new DateFieldTyper());
        this.registerFieldTyper(new EnumFieldTyper());
        this.registerFieldTyper(new ArrayFieldTyper());
        this.registerFieldTyper(new OneToOneFieldTyper());
        this.registerFieldTyper(new ManyToOneFieldTyper());
        this.registerFieldTyper(new OneToManyFieldTyper());
        this.registerFieldTyper(new ManyToManyFieldTyper());
        this.registerFieldTyper(new BinaryFieldTyper());
        this.registerFieldTyper(new JsonFieldTyper());
    }

    getFieldTyper(fieldType: string): IModelFieldTyper | undefined {
        return this._fieldTypes.get(fieldType);
    }
    registerFieldTyper(fieldType: IModelFieldTyper): void {
        this._fieldTypes.set(fieldType.type, fieldType);
    }
    getFieldTypers(): IModelFieldTyper[] {
        return Array.from(this._fieldTypes.values());
    }
}
