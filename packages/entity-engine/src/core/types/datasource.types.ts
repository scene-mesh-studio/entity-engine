import type { IEntityDataSource } from '../../types';

export interface IEntityDataSourceFactory {
    getDataSource(): IEntityDataSource;
}
