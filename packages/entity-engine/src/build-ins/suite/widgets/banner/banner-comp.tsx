'use client';

import '@mantine/carousel/styles.css';

import type { EntityWidgetProps } from '../../../../components/types';

import { Carousel } from '@mantine/carousel';
import { Text, Stack, Button, BackgroundImage } from '@mantine/core';

import { useMasterDetailViewContainer } from '../../../../uikit';

type BannerOptions = {
    items?: {
        title: string;
        subtitle: string;
        image: string;
        color?: string;
        action?: string;
    }[];
};

export function BannerComp(props: EntityWidgetProps) {
    const { value, object, model, view, field, behavior, fieldControl, fieldState } = props;
    const options = (field.widgetOptions || {}) as BannerOptions;
    return (
        <Carousel withIndicators>
            {(options.items || []).map((item, index) => (
                <Carousel.Slide key={index}>
                    <BackgroundImage src={item.image} w="100%" h="100%">
                        <Stack
                            w="100%"
                            h="100%"
                            justify="start"
                            align="start"
                            p={36}
                            pl={48}
                            gap={8}
                        >
                            <Text size="xl" c={item.color || 'gray.9'} fw={900}>
                                {item.title}
                            </Text>
                            <Text size="sm" c={item.color || 'gray.7'}>
                                {item.subtitle}
                            </Text>
                            {item.action && <ActionButton actionString={item.action} />}
                        </Stack>
                    </BackgroundImage>
                </Carousel.Slide>
            ))}
        </Carousel>
    );
}

type ActionButtonProps = {
    actionString: string;
};

function ActionButton({ actionString }: ActionButtonProps) {
    const { performAction } = useMasterDetailViewContainer();
    function handleAction(): void {
        // act::modelName::viewType::viewName
        const slug = actionString.split('::');
        if (slug.length > 0) {
            if (slug[0] === 'view' && slug.length >= 3) {
                performAction({
                    actionType: 'view',
                    payload: {
                        modelName: slug[1],
                        viewType: slug[2],
                        viewName: slug.length > 3 ? slug[3] : undefined,
                        target: '__parent__',
                    },
                    contextObject: undefined,
                });
            }
        }
    }

    return (
        <Button variant="filled" onClick={() => handleAction()}>
            查看
        </Button>
    );
}
