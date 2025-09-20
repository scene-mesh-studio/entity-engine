'use client';

import type { EntityViewProps } from '@scenemesh/entity-engine';

import { useEntityEngine } from '@scenemesh/entity-engine';

export function SplashViewComp(props: EntityViewProps) {
    const { model, baseObjectId, viewData, behavior } = props;
    const engine = useEntityEngine();

    const navigation = [
        { name: '产品介绍', href: '#' },
        { name: '功能特性', href: '#' },
        { name: '市场营销', href: '#' },
        { name: '公司简介', href: '#' },
    ];

    return <div>...</div>;
}
