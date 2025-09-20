import type { EntityWidget, IEntityComponentSuiteAdapter } from '@scenemesh/entity-engine';

import { RichTextEditorWidget } from './widgets';

export class AdditionsSuiteAdapter implements IEntityComponentSuiteAdapter {
    private _suiteName: string = 'additions';
    private _suiteVersion: string = '0.0.1';
    private _widgetMap: Map<string, EntityWidget> = new Map();

    constructor() {
        // 初始化视图和组件
        this._widgetMap.set('richeditor', new RichTextEditorWidget());
    }

    get suiteName(): string {
        return this._suiteName;
    }

    get suiteVersion(): string {
        return this._suiteVersion;
    }

    getWidget(widgetName: string): EntityWidget | undefined {
        return this._widgetMap.get(widgetName);
    }

    getWidgets(): EntityWidget[] {
        return Array.from(this._widgetMap.values());
    }
}
