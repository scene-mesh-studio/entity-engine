import type { EntityWidget, IEntityComponentSuiteAdapter } from '../../components/types';

import { IdWidget } from './widgets/id';
import { TabWidget } from './widgets/tab';
import { ListWidget } from './widgets/list';
import { InfoWidget } from './widgets/info';
import { LogoWidget } from './widgets/logo';
import { ImageWidget } from './widgets/image';
import { GraphWidget } from './widgets/graph';
import { SelectWidget } from './widgets/select';
import { CustomWidget } from './widgets/custom';
import { NumberWidget } from './widgets/number';
import { CheckboxWidget } from './widgets/checkbox';
import { PasswordWidget } from './widgets/password';
import { RendererWidget } from './widgets/renderer';
import { MarkdownWidget } from './widgets/markdown';
import { TextfieldWidget } from './widgets/textfield';
import { ContainerWidget } from './widgets/container';
import { NavigatorWidget } from './widgets/navigator';
import { DateWidget } from './widgets/date/date-widget';
import { ActionWidget } from './widgets/action/action-widget';
import { SwitchWidget } from './widgets/switch/switch-widget';
import { BannerWidget } from './widgets/banner/banner.widget';
import { StatCardWidget } from './widgets/statcard/statcard-widget';
import { DatalistWidget } from './widgets/datalist/datalist-widget';
import { ReferenceWidget } from './widgets/reference/reference-widget';

export class EntityBuildinSuiteAdapter implements IEntityComponentSuiteAdapter {
    private _suiteName: string = 'build-in';
    private _suiteVersion: string = '0.0.1';
    private _widgetMap: Map<string, EntityWidget> = new Map();

    constructor() {
        // 初始化视图和组件
        this._widgetMap.set('textfield', new TextfieldWidget());
        this._widgetMap.set('select', new SelectWidget());
        this._widgetMap.set('image', new ImageWidget());
        this._widgetMap.set('id', new IdWidget());
        this._widgetMap.set('reference', new ReferenceWidget());
        this._widgetMap.set('references', new ReferenceWidget());
        this._widgetMap.set('action', new ActionWidget());
        this._widgetMap.set('switch', new SwitchWidget());
        this._widgetMap.set('checkbox', new CheckboxWidget());
        this._widgetMap.set('password', new PasswordWidget());
        this._widgetMap.set('custom', new CustomWidget());
        this._widgetMap.set('list', new ListWidget());
        this._widgetMap.set('container', new ContainerWidget());
        this._widgetMap.set('tab', new TabWidget());
        this._widgetMap.set('navigator', new NavigatorWidget());
        this._widgetMap.set('info', new InfoWidget());
        this._widgetMap.set('graph', new GraphWidget());
        this._widgetMap.set('number', new NumberWidget());
        this._widgetMap.set('logo', new LogoWidget());
        this._widgetMap.set('renderer', new RendererWidget());
        this._widgetMap.set('markdown', new MarkdownWidget());
        this._widgetMap.set('date', new DateWidget());

        this._widgetMap.set('statcard', new StatCardWidget());
        this._widgetMap.set('banner', new BannerWidget());
        this._widgetMap.set('datalist', new DatalistWidget());
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
