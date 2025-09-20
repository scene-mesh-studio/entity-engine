import React from 'react';

import { ImageComp } from './image-comp';
import { useEntityEngine } from '../../../../uikit';
import { EntityWidget, type EntityWidgetProps } from '../../../../components';

export class ImageWidget extends EntityWidget {
    readonly info = {
        widgetName: 'image',
        displayName: '图片组件',
        icon: 'image_icon',
        description: '用于上传和显示图片的组件',
    };

    readonly Component: React.FC<EntityWidgetProps> = (props) => <ImageCompWrapper {...props} />;
}

function ImageCompWrapper(props: EntityWidgetProps) {
    const { model, field: viewField } = props;
    const engine = useEntityEngine();

    const width = viewField.widgetOptions?.width || '100';
    const height = viewField.widgetOptions?.height || '100';
    const accept = viewField.widgetOptions?.accept || 'image/*';
    const maxSize = viewField.widgetOptions?.maxSize || 5 * 1024 * 1024; // 默认5MB
    const showInfo = viewField.widgetOptions?.showInfo ?? true; // 是否显示上传信息

    const handleFileUpload = async (file: File) => {
        console.log('File uploaded:', JSON.stringify(file));

        // 通过request multipart/form-data上传文件
        const formData = new FormData();
        formData.append('file', file);
        formData.append('modelName', model?.name || 'default'); // 修复拼写错误

        // 上传文件
        // 这里可以使用fetch或axios等库进行文件上传 /api/ee/utils/upload
        const response = await fetch(engine.settings.getUrl('/utils/upload'), {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('File upload failed');
        }

        const ret = await response.json();

        return ret;

        // return {
        //   fileName: "test.jpg",
        //   fileType: "jpeg",
        //   fileSize: 1024,
        //   filePath: `dataModel/test.jpg`,
        // };
    };

    return (
        <ImageComp
            {...props}
            onFileUpload={handleFileUpload}
            width={width as string}
            height={height as string}
            accept={accept as string}
            maxSize={maxSize as number}
            showInfo={false}
        />
    );
}
