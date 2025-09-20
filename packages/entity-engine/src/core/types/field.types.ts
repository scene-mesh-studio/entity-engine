import type { IModelFieldTyper } from '../../types';

export interface IModelFieldTyperRegistry {
    getFieldTyper(fieldType: string): IModelFieldTyper | undefined;
    registerFieldTyper(fieldType: IModelFieldTyper): void;
    getFieldTypers(): IModelFieldTyper[];
}
