import type { IEntityDataSource } from '../../types';
import type { IEntityEngineSettings, IEntityDataSourceFactory } from '../types';

import { TRPCEntityObjectDataSource } from './trpc.datasource';

export class EntityDataSourceFactory implements IEntityDataSourceFactory {
    private _dataSource: IEntityDataSource | null = null;
    private _settings: IEntityEngineSettings;

    constructor(settings: IEntityEngineSettings) {
        this._settings = settings;
    }

    getDataSource(): IEntityDataSource {
        if (!this._dataSource) {
            this._dataSource = new TRPCEntityObjectDataSource(this._settings);
        }
        return this._dataSource;
    }
}
