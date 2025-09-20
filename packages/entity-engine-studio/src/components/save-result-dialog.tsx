/**
 * 保存结果反馈对话框
 */

import { Box, Text, Modal, Stack, Alert, Paper, Button } from '@mantine/core';

import { Icon } from '../utils/icon-mapping';
import { componentStyles } from '../utils/theme';

export interface SaveResultDialogProps {
    open: boolean;
    onClose: () => void;
    result: {
        success: boolean;
        message?: string;
        error?: string;
        savedData?: any;
    } | null;
    onReload?: () => void;
}

export function SaveResultDialog({ open, onClose, result, onReload }: SaveResultDialogProps) {
    if (!result) return null;

    const handleReloadAndClose = () => {
        if (onReload) {
            onReload();
        }
    };

    return (
        <Modal
            opened={open}
            onClose={onClose}
            size="md"
            centered
            zIndex={2100}
            styles={{
                inner: {
                    zIndex: 2100,
                },
                overlay: {
                    zIndex: 2099,
                },
                content: {
                    maxHeight: '90vh',
                    overflowY: 'auto',
                },
            }}
            closeOnClickOutside={false}
            closeOnEscape={false}
            title={
                <Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon
                        icon={
                            result.success ? 'solar:check-circle-bold' : 'solar:close-circle-bold'
                        }
                        size={24}
                        style={{
                            color: result.success
                                ? componentStyles.alert.success.color
                                : componentStyles.alert.error.color,
                        }}
                    />
                    <Text size="lg" fw={600}>
                        {result.success ? '保存成功' : '保存失败'}
                    </Text>
                </Box>
            }
        >
            <Stack gap="md">
                {/* 结果消息 */}
                <Alert
                    color={result.success ? 'green' : 'red'}
                    variant="light"
                    icon={
                        <Icon
                            icon={
                                result.success
                                    ? 'solar:check-circle-bold'
                                    : 'solar:close-circle-bold'
                            }
                            size={16}
                        />
                    }
                >
                    <Text size="sm">
                        {result.success
                            ? result.message || '配置已成功保存到服务器'
                            : result.error || '保存过程中发生错误'}
                    </Text>
                </Alert>

                {/* 成功时的详细信息 */}
                {result.success && result.savedData && (
                    <Paper
                        p="md"
                        withBorder
                        style={{ backgroundColor: componentStyles.welcomeScreen.cardBackground }}
                    >
                        <Stack gap="xs">
                            <Text size="sm" fw={600} c={componentStyles.text.caption}>
                                保存详情:
                            </Text>
                            {result.savedData.model && (
                                <Text size="xs" c={componentStyles.text.muted}>
                                    • 模型: {result.savedData.model.name} (
                                    {result.savedData.model.fields?.length || 0} 个字段)
                                </Text>
                            )}
                            {result.savedData.views && result.savedData.views.length > 0 && (
                                <Text size="xs" c={componentStyles.text.muted}>
                                    • 视图: {result.savedData.views.length} 个视图配置
                                </Text>
                            )}
                        </Stack>
                    </Paper>
                )}

                {/* 错误时的详细信息 */}
                {!result.success && result.error && (
                    <Paper
                        p="md"
                        withBorder
                        style={{
                            backgroundColor: componentStyles.alert.error.backgroundColor,
                            borderColor: componentStyles.alert.error.borderColor,
                        }}
                    >
                        <Text size="xs" ff="monospace" c={componentStyles.text.caption}>
                            {result.error}
                        </Text>
                    </Paper>
                )}

                {/* 操作按钮 */}
                <Box
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        marginTop: '16px',
                    }}
                >
                    {!result.success && (
                        <Button
                            variant="outline"
                            onClick={onClose}
                            leftSection={<Icon icon="solar:close-circle-bold" size={16} />}
                        >
                            关闭
                        </Button>
                    )}

                    {result.success && (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                leftSection={<Icon icon="solar:close-circle-bold" size={16} />}
                            >
                                关闭
                            </Button>

                            {onReload && (
                                <Button
                                    variant="filled"
                                    onClick={handleReloadAndClose}
                                    leftSection={<Icon icon="solar:refresh-bold" size={16} />}
                                    style={{
                                        backgroundColor:
                                            componentStyles.button.primary.backgroundColor,
                                        color: componentStyles.button.primary.color,
                                    }}
                                >
                                    刷新数据
                                </Button>
                            )}
                        </>
                    )}
                </Box>
            </Stack>
        </Modal>
    );
}
