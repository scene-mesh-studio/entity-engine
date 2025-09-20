import type { IEntityQueryItem } from '../../../types';

import { QueryOperator } from '../../../types';

export function getQueryOperatorName(opr: QueryOperator): string {
    switch (opr) {
        case QueryOperator.NONE:
            return '--';
        case QueryOperator.EQ:
            return '等于';
        case QueryOperator.NE:
            return '不等于';
        case QueryOperator.GT:
            return '大于';
        case QueryOperator.LT:
            return '小于';
        case QueryOperator.GTE:
            return '大于等于';
        case QueryOperator.LTE:
            return '小于等于';
        case QueryOperator.CONTAINS:
            return '包含';
        case QueryOperator.STARTS_WITH:
            return '开始于';
        case QueryOperator.ENDS_WITH:
            return '结束于';
        case QueryOperator.IN:
            return '在其中';
        case QueryOperator.NOT_IN:
            return '不在其中';
        case QueryOperator.IS_NULL:
            return '为空';
        case QueryOperator.IS_NOT_NULL:
            return '不为空';
        case QueryOperator.BETWEEN:
            return '介于';
        default:
            return '未知';
    }
}

export function isQueryOperatorWithoutValues(opr: QueryOperator): boolean {
    return (
        opr === QueryOperator.IS_NULL ||
        opr === QueryOperator.IS_NOT_NULL ||
        opr === QueryOperator.NONE
    );
}

export function convertFilterToQuery(filterData: {
    [fieldName: string]: { operator: string; value: any };
}): IEntityQueryItem | undefined {
    if (!filterData) return undefined;
    const items: IEntityQueryItem[] = [];
    //遍历filterData
    for (const [fieldName, filterItem] of Object.entries(filterData)) {
        const { operator, value } = filterItem;
        const queryItem: IEntityQueryItem = {
            field: fieldName,
            operator: operator as QueryOperator,
            value,
        };
        items.push(queryItem);
    }
    if (items.length === 0) return undefined;
    return { and: items };
}
