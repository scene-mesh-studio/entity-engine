'use client';

import React, { useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Eye, Trash2, Upload } from 'lucide-react';
import {
    Box,
    Text,
    Group,
    Image,
    Modal,
    Stack,
    Loader,
    Tooltip,
    ActionIcon,
    AspectRatio,
} from '@mantine/core';

import { type EntityWidgetProps } from '../../../../components';

// 文件数据结构接口
interface FileData {
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
}

// 扩展的组件属性接口
interface ImageCompProps extends EntityWidgetProps {
    onFileUpload?: (file: File) => Promise<FileData>;
    width?: string | number | undefined;
    height?: string | number | undefined;
    accept?: string | undefined;
    maxSize?: number | undefined;
    showInfo?: boolean;
}

// 辅助函数：获取图片URL
const getImageUrl = (value: any): string | null => {
    if (!value) return null;

    // 如果是字符串，直接返回
    if (typeof value === 'string') {
        // 如果已经是完整的URL（包含协议）或base64，直接返回
        if (value.startsWith('http') || value.startsWith('data:')) {
            return value;
        }
        // 否则拼接uploads路径
        return `/uploads/${value}`;
    }

    // 如果是文件数据对象，返回 filePath
    if (typeof value === 'object' && value.filePath) {
        const filePath = value.filePath;
        // 如果已经是完整的URL（包含协议）或base64，直接返回
        if (filePath.startsWith('http') || filePath.startsWith('data:')) {
            return filePath;
        }
        // 否则拼接uploads路径
        return `/uploads/${filePath}`;
    }

    return null;
};

// 辅助函数：获取文件信息
const getFileInfo = (value: any): FileData | null => {
    if (!value) return null;

    // 如果是文件数据对象
    if (typeof value === 'object' && value.fileName && value.filePath) {
        return value as FileData;
    }

    return null;
};

// 辅助函数：格式化文件大小
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function ImageComp(props: ImageCompProps) {
    const { behavior, maintain } = props;
    const readonly = maintain?.readonly || false;

    if (behavior.mode === 'edit') {
        return <InnerImageEdit {...props} readonly={readonly} />;
    } else {
        return <InnerImageDisplay {...props} />;
    }
}

function InnerImageDisplay(props: ImageCompProps) {
    const { value, field, width, height, showInfo } = props;
    const [opened, { open, close }] = useDisclosure(false);

    const imageUrl = getImageUrl(value);
    const fileInfo = getFileInfo(value);

    if (!imageUrl) {
        return (
            <Box
                p="md"
                style={{
                    border: '1px dashed #ced4da',
                    borderRadius: '4px',
                    textAlign: 'start',
                }}
            >
                <Text size="sm" c="dimmed">
                    无图片
                </Text>
            </Box>
        );
    }

    return (
        <>
            <Stack gap="xs" align="start">
                <Box style={{ position: 'relative', display: 'inline-block' }}>
                    <AspectRatio ratio={1080 / 720} maw={width || 100} mx="auto">
                        <Image
                            src={imageUrl}
                            alt={field?.description || field?.name || '图片'}
                            fit="cover"
                            radius="md"
                            style={{
                                cursor: 'pointer',
                                width,
                                height,
                            }}
                            onClick={open}
                        />
                    </AspectRatio>
                    {/* <ActionIcon
                        variant="filled"
                        size="sm"
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        }}
                        onClick={open}
                    >
                        <Eye size={14} />
                    </ActionIcon> */}
                </Box>

                {/* 显示文件信息 */}
                {showInfo && fileInfo && (
                    <Box>
                        <Text size="xs" c="dimmed">
                            {fileInfo.fileName}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {formatFileSize(fileInfo.fileSize)} • {fileInfo.fileType}
                        </Text>
                    </Box>
                )}
            </Stack>

            <Modal
                opened={opened}
                onClose={close}
                size="lg"
                title="图片预览"
                centered
                zIndex={9999999}
            >
                <Stack gap="md">
                    <Image
                        src={imageUrl}
                        alt={field?.description || field?.name || '图片'}
                        fit="contain"
                        style={{ maxHeight: '70vh' }}
                    />
                    {fileInfo && (
                        <Box p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <Text size="sm" fw={500}>
                                {fileInfo.fileName}
                            </Text>
                            <Group gap="md" mt="xs">
                                <Text size="xs" c="dimmed">
                                    大小: {formatFileSize(fileInfo.fileSize)}
                                </Text>
                                <Text size="xs" c="dimmed">
                                    类型: {fileInfo.fileType}
                                </Text>
                            </Group>
                        </Box>
                    )}
                </Stack>
            </Modal>
        </>
    );
}

function InnerImageEdit(props: ImageCompProps & { readonly: boolean }) {
    const { value, field, fieldControl, readonly, onFileUpload, width, height, accept, maxSize } =
        props;
    const [currentValue, setCurrentValue] = useState(value);
    const [opened, { open, close }] = useDisclosure(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const imageUrl = getImageUrl(currentValue);
    const fileInfo = getFileInfo(currentValue);

    // 处理文件上传
    const handleFileChange = async (file: File | null) => {
        if (!file) {
            return;
        }

        // 验证文件类型
        const acceptTypes = accept || 'image/*';
        const acceptedTypes = acceptTypes.split(',').map((type) => type.trim());
        const isValidType = acceptedTypes.some((type) => {
            if (type === 'image/*') return file.type.startsWith('image/');
            return file.type === type || file.name.toLowerCase().endsWith(type.replace('*', ''));
        });

        if (!isValidType) {
            setUploadError(`请选择支持的文件类型: ${acceptTypes}`);
            return;
        }

        // 验证文件大小
        const fileSizeLimit = maxSize || 5 * 1024 * 1024; // 默认5MB
        if (file.size > fileSizeLimit) {
            setUploadError(`文件大小不能超过 ${formatFileSize(fileSizeLimit)}`);
            return;
        }

        setUploadError(null);
        setUploading(true);

        try {
            if (onFileUpload) {
                // 使用外部提供的上传方法
                const fileData = await onFileUpload(file);
                fieldControl?.onChange?.(fileData);
                setCurrentValue(fileData); // 更新当前值
            } else {
                // 回退到本地 base64 处理
                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result as string;

                    // 创建文件数据对象
                    const fileData: FileData = {
                        fileName: file.name,
                        filePath: result, // 这里使用 base64 作为临时路径
                        fileSize: file.size,
                        fileType: file.type,
                    };

                    fieldControl?.onChange?.(fileData);
                    setUploading(false); // 在成功后设置上传状态为false
                };
                reader.onerror = () => {
                    setUploadError('文件读取失败');
                    setUploading(false);
                };
                reader.readAsDataURL(file);
                return; // 早期返回，避免执行 finally 块
            }
        } catch (error) {
            console.error('文件上传失败:', error);
            setUploadError(error instanceof Error ? error.message : '文件上传失败');
        } finally {
            if (onFileUpload) {
                // 只有在使用外部上传方法时才在 finally 中设置状态
                setUploading(false);
            }
        }
    };

    // 清除图片
    const handleClear = () => {
        fieldControl?.onChange?.(null);
        setUploadError(null);
    };

    // 处理图片点击 - 触发文件选择
    const handleImageClick = () => {
        if (uploading || readonly) return;

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept || 'image/*';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            handleFileChange(file || null);
        };
        input.click();
    };

    if (readonly) {
        return <InnerImageDisplay {...props} />;
    }

    return (
        <Stack gap="xs">
            <Stack gap="xs" align="start">
                <Box style={{ position: 'relative', display: 'inline-block' }}>
                    {imageUrl ? (
                        // 有图片时显示图片
                        <>
                            <AspectRatio ratio={1080 / 720} maw={width || 200} mx="auto">
                                <Image
                                    src={imageUrl}
                                    alt={field?.description || field?.name || '图片'}
                                    fit="cover"
                                    radius="md"
                                    style={{
                                        cursor: uploading ? 'default' : 'pointer',
                                        width,
                                        height,
                                    }}
                                    onClick={handleImageClick}
                                />
                            </AspectRatio>
                            {/* 操作按钮 */}
                            <Group
                                gap="xs"
                                style={{
                                    position: 'absolute',
                                    top: 8,
                                    right: 8,
                                }}
                            >
                                <Tooltip label="预览">
                                    <ActionIcon
                                        variant="filled"
                                        size="sm"
                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
                                        onClick={open}
                                    >
                                        <Eye size={14} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label="删除">
                                    <ActionIcon
                                        variant="filled"
                                        size="sm"
                                        color="red"
                                        style={{ backgroundColor: 'rgba(255, 0, 0, 0.6)' }}
                                        onClick={handleClear}
                                        disabled={uploading}
                                    >
                                        <Trash2 size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>
                        </>
                    ) : (
                        // 无图片时显示默认灰色背景
                        <AspectRatio ratio={1080 / 720} maw={width || 200} mx="auto">
                            <Box
                                style={{
                                    width: width || 200,
                                    height: height || 150,
                                    backgroundColor: '#f8f9fa',
                                    border: '2px dashed #ced4da',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: uploading ? 'default' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    position: 'relative',
                                }}
                                onClick={handleImageClick}
                                onMouseEnter={(e) => {
                                    if (!uploading) {
                                        e.currentTarget.style.backgroundColor = '#e9ecef';
                                        e.currentTarget.style.borderColor = '#adb5bd';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!uploading) {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                        e.currentTarget.style.borderColor = '#ced4da';
                                    }
                                }}
                            >
                                {uploading ? (
                                    <>
                                        <Loader size={20} />
                                        <Text size="sm" c="dimmed" mt="xs">
                                            上传中...
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} color="#adb5bd" />
                                        <Text size="xs" c="dimmed" mt="xs">
                                            点击选择图片
                                        </Text>
                                    </>
                                )}
                            </Box>
                        </AspectRatio>
                    )}
                </Box>

                {/* 显示文件信息 */}
                {fileInfo && (
                    <Box>
                        <Text size="xs" c="dimmed">
                            {fileInfo.fileName}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {formatFileSize(fileInfo.fileSize)} • {fileInfo.fileType}
                        </Text>
                    </Box>
                )}

                {/* 上传状态提示 */}
                {uploading && (
                    <Text size="xs" c="blue">
                        文件上传中，请稍候...
                    </Text>
                )}
            </Stack>

            {uploadError && (
                <Text size="sm" c="red">
                    {uploadError}
                </Text>
            )}

            {!imageUrl && !uploading && (
                <Text size="xs" c="dimmed">
                    支持 {accept || 'JPG、PNG、GIF'} 格式，文件大小不超过{' '}
                    {formatFileSize(maxSize || 5 * 1024 * 1024)}
                </Text>
            )}

            {/* 预览模态框 */}
            {imageUrl && (
                <Modal opened={opened} onClose={close} size="lg" title="图片预览" zIndex={9999999}>
                    <Stack gap="md">
                        <Image
                            src={imageUrl}
                            alt={field?.description || field?.name || '图片'}
                            fit="contain"
                            style={{ maxHeight: '70vh' }}
                        />
                        {fileInfo && (
                            <Box p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                <Text size="sm" fw={500}>
                                    {fileInfo.fileName}
                                </Text>
                                <Group gap="md" mt="xs">
                                    <Text size="xs" c="dimmed">
                                        大小: {formatFileSize(fileInfo.fileSize)}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        类型: {fileInfo.fileType}
                                    </Text>
                                </Group>
                            </Box>
                        )}
                    </Stack>
                </Modal>
            )}
        </Stack>
    );
}
