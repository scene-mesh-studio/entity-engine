import type { IEntityViewDelegate, IEntityModelDelegate } from '../../core';

import React from 'react';

import { useEntityEngine } from '../../uikit';

type EntityNamedRendererProps = {
    name?: string;
    slotName?: string; // 可选的插槽名称
    viewData?: IEntityViewDelegate;
    model?: IEntityModelDelegate;
    addationalProps?: any; // 额外的属性
    children?: React.ReactNode;
    render?: (comp: React.ReactNode) => React.ReactNode; // 自定义渲染函数
};

export function EntityNamedRenderer(props: EntityNamedRendererProps) {
    const engine = useEntityEngine();

    const rendererName = props.name;
    const slotName = props.slotName;
    let renderComp: React.ReactNode | null = null;

    if (rendererName) {
        const renderer = engine.componentRegistry.getRenderer(rendererName);
        if (renderer && !renderer.disabled) {
            renderComp = renderer.renderer(props);
        }
    } else if (slotName) {
        const renderers = engine.componentRegistry.getRenderersBySlot(slotName);
        if (renderers.length > 0) {
            const comps: React.ReactNode[] = [];
            renderers.forEach((renderer, index) => {
                const cmp = renderer.renderer(props);
                console.log('EntityNamedRenderer:', slotName, renderer.name, isReactNodeEmpty(cmp));
                if (cmp && !isReactNodeEmpty(cmp)) {
                    comps.push(<React.Fragment key={index}>{cmp}</React.Fragment>);
                }
            });
            if (comps.length > 0) {
                renderComp = comps;
            }
            // renderComp = renderers.map((renderer, index) => (
            //     <React.Fragment key={index}>{renderer.renderer(props)}</React.Fragment>
            // ));
        }
    }

    if (renderComp) {
        if (props.render) {
            return props.render(renderComp);
        }
        return renderComp;
    }
    if (props.children) {
        return props.children;
    }

    return null;
}

function isReactNodeEmpty(node: React.ReactNode): boolean {
    if (node == null || typeof node === 'boolean') {
        // null, undefined, true, false
        return true;
    }

    if (typeof node === 'string' && node.trim() === '') {
        // 空字符串或只包含空格的字符串
        return true;
    }

    if (typeof node === 'number') {
        // 其他数字都会被渲染
        return false;
    }

    if (Array.isArray(node)) {
        // 如果是数组，则当所有子项都为空时，该数组视为空
        return node.length === 0 || node.every(isReactNodeEmpty);
    }

    if (React.isValidElement(node)) {
        // 检查是否是 Fragment
        if (node.type === React.Fragment) {
            const element = node as React.ReactElement<{ children?: React.ReactNode }>;
            return isReactNodeEmpty(element.props.children);
        }

        // 对于其他 JSX 元素，检查是否有子元素
        const element = node as React.ReactElement<{ children?: React.ReactNode }>;
        if (element.props && 'children' in element.props) {
            return isReactNodeEmpty(element.props.children);
        }

        // 如果没有 children 属性，则认为不为空（比如 <img />, <br /> 等自闭合标签）
        return false;
    }

    // 对于其他类型的节点（比如函数组件返回的内容），使用 React.Children.count 作为兜底
    return React.Children.count(node) === 0;
}
