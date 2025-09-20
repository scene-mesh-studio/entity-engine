import type React from 'react';

import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Fragment, isValidElement } from 'react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// 判断是否为空元素, 包括返回null的元素
export function isDeepEmptyElement(element: React.ReactNode): boolean {
    // null 或 undefined
    if (element == null) {
        return true;
    }

    // 布尔值或空字符串
    if (typeof element === 'boolean' || element === '') {
        return true;
    }

    // 数字0被认为是有内容的
    if (typeof element === 'number' || typeof element === 'string') {
        return false;
    }

    // 数组类型（React.Fragment 的 children 或数组元素）
    if (Array.isArray(element)) {
        return element.length === 0 || element.every(isDeepEmptyElement);
    }

    // React 元素
    if (isValidElement(element)) {
        // React.Fragment
        if (element.type === Fragment) {
            return isDeepEmptyElement((element.props as any).children);
        }

        // 其他组件，检查其 children
        const props = element.props as any;
        if (props && typeof props === 'object' && 'children' in props) {
            return isDeepEmptyElement(props.children);
        }

        // 没有 children 的元素被认为是有内容的（比如 <img />、<br /> 等）
        return false;
    }

    // 其他情况（如函数组件返回值等）认为不为空
    return false;
}
