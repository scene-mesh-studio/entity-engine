'use client';

import type { EntityWidgetProps } from '../../../../components/types';

import { Icon } from '@iconify/react';
import { Text, Image, AspectRatio } from '@mantine/core';

import { useEntityEngine } from '../../../../uikit';

export function LogoComp(props: EntityWidgetProps) {
    const {
        value: fieldValue,
        object,
        model,
        view,
        field,
        behavior,
        fieldControl,
        fieldState,
    } = props;
    const engine = useEntityEngine();
    const logoUrl = field.widgetOptions?.logoUrl;
    const icon = field.widgetOptions?.icon;
    const title = field.title || model.title || 'LOGO';
    const description = field.description || model.description;
    const logoWidth = field.widgetOptions?.logoWidth || 120;
    const logoHeight = field.widgetOptions?.logoHeight || 120;

    console.log('LogoComp props:', props);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 10,
                height: '60px',
            }}
        >
            {logoUrl ? (
                <AspectRatio
                    ratio={1}
                    style={{ width: logoWidth as number, height: logoHeight as number }}
                >
                    <Image
                        src={logoUrl}
                        alt="logo"
                        width={logoWidth as number}
                        height={logoHeight as number}
                        fit="fill"
                        radius="md"
                    />
                </AspectRatio>
            ) : icon ? (
                <Icon
                    icon={icon as string}
                    color="blue"
                    width={logoWidth as number}
                    height={logoHeight as number}
                    style={{ width: logoWidth as number, height: logoHeight as number }}
                />
            ) : (
                <div style={{ width: 40, height: 40, marginLeft: 10 }} />
            )}

            <Text size="md" fw={500}>
                {title}
            </Text>
        </div>
    );
}
