/**
 * AI Module 主题色彩规范 - 完全基于 Mantine CSS 变量
 * 自动跟随主包的亮色/暗色模式切换，无需独立维护主题系统
 */

export const aiThemeColors = {
    // 主要文本颜色 - 使用 Mantine CSS 变量
    primaryText: 'var(--mantine-color-text)', // 主要文本颜色，自动适配主题
    secondaryText: 'var(--mantine-color-dimmed)', // 次要文本颜色
    headingText: 'var(--mantine-color-text)', // 标题文本颜色

    // 语义化文本颜色 - 优化深色模式
    mutedText: 'var(--mantine-color-dimmed)', // 静音文本，使用dimmed确保深色模式协调
    placeholderText: 'var(--mantine-color-placeholder)', // 占位符文本

    // 状态颜色 - 使用 Mantine 预定义颜色
    success: 'var(--mantine-color-green-filled)',
    warning: 'var(--mantine-color-yellow-filled)',
    error: 'var(--mantine-color-red-filled)',
    info: 'var(--mantine-color-blue-filled)',

    // 浅色状态颜色（用于背景）- 深色模式自动适配
    successLight: 'var(--mantine-color-green-light)',
    warningLight: 'var(--mantine-color-yellow-light)',
    errorLight: 'var(--mantine-color-red-light)',
    infoLight: 'var(--mantine-color-blue-light)',

    // 背景颜色 - 深色模式自动切换
    bodyBackground: 'var(--mantine-color-body)', // 主体背景
    cardBackground: 'var(--mantine-color-default)', // 卡片背景，使用default确保深色模式协调
    paperBackground: 'var(--mantine-color-default)', // 纸张背景
    codeBackground: 'var(--mantine-color-default)', // 代码背景，深色模式下自动变深

    // 边框和分隔线 - 深色模式自动适配
    border: 'var(--mantine-color-default-border)', // 默认边框
    borderLight: 'var(--mantine-color-default-border)', // 统一使用default-border
    divider: 'var(--mantine-color-default-border)', // 分隔线

    // 交互状态 - 深色模式友好
    hoverBackground: 'var(--mantine-color-default-hover)', // 悬浮背景，深色模式自动调整
    selectedBackground: 'var(--mantine-color-blue-light)', // 选中背景 - 使用蓝色，深色模式下更清晰
    selectedText: 'var(--mantine-color-blue-filled)', // 选中文本 - 使用蓝色，深色模式下更清晰

    // 输入组件 - 深色模式协调
    inputBackground: 'var(--mantine-color-default)', // 输入框背景
    inputBorder: 'var(--mantine-color-default-border)', // 输入框边框
    inputPlaceholder: 'var(--mantine-color-placeholder)', // 输入框占位符
};

/**
 * 获取主题适配的Text属性 - 深色模式优化版本
 */
export function getThemedTextProps(
    variant:
        | 'primary'
        | 'secondary'
        | 'heading'
        | 'muted'
        | 'success'
        | 'warning'
        | 'error'
        | 'info'
        | 'subtitle'
        | 'caption' = 'primary'
) {
    switch (variant) {
        case 'primary':
            return { c: aiThemeColors.primaryText };
        case 'secondary':
            return { c: aiThemeColors.secondaryText };
        case 'heading':
            return { c: aiThemeColors.headingText, fw: 600 };
        case 'muted':
            // 优化muted文字，深色模式下使用更清晰的颜色
            return { c: 'var(--mantine-color-gray-6)' }; // 深色模式下更清晰
        case 'subtitle':
            // 新增：副标题文字，介于primary和secondary之间
            return { c: 'var(--mantine-color-gray-7)', fw: 500 };
        case 'caption':
            // 新增：说明文字，比muted更清晰但比secondary更弱
            return { c: 'var(--mantine-color-gray-6)' };
        case 'success':
            return { c: aiThemeColors.success };
        case 'warning':
            return { c: aiThemeColors.warning };
        case 'error':
            return { c: aiThemeColors.error };
        case 'info':
            return { c: aiThemeColors.info };
        default:
            return { c: aiThemeColors.primaryText };
    }
}

/**
 * 获取主题适配的样式对象
 */
export function getThemedStyles() {
    return {
        // 背景样式
        cardBackground: aiThemeColors.cardBackground,
        paperBackground: aiThemeColors.paperBackground,
        bodyBackground: aiThemeColors.bodyBackground,
        codeBackground: aiThemeColors.codeBackground,

        // 边框样式
        border: aiThemeColors.border,
        borderLight: aiThemeColors.borderLight,
        divider: aiThemeColors.divider,

        // 交互状态样式
        hoverBackground: aiThemeColors.hoverBackground,
        selectedBackground: aiThemeColors.selectedBackground,
        selectedText: aiThemeColors.selectedText,

        // 文本样式
        primaryText: aiThemeColors.primaryText,
        secondaryText: aiThemeColors.secondaryText,
        mutedText: aiThemeColors.mutedText,

        // 状态样式
        successBackground: aiThemeColors.successLight,
        warningBackground: aiThemeColors.warningLight,
        errorBackground: aiThemeColors.errorLight,
        infoBackground: aiThemeColors.infoLight,
    };
}

/**
 * 获取适配特定组件的样式
 */
export const componentStyles = {
    // 共享基础样式
    cardBackground: aiThemeColors.cardBackground,

    // 聊天对话框样式 - 深色模式优化
    chatDialog: {
        titleColor: aiThemeColors.headingText,
        descriptionColor: aiThemeColors.secondaryText,
        cardBackground: aiThemeColors.cardBackground,
        border: aiThemeColors.border,
    },

    // 消息气泡样式
    messageBubble: {
        userBackground: 'var(--mantine-color-blue-filled)',
        userText: 'var(--mantine-color-white)',
        aiBackground: aiThemeColors.cardBackground,
        aiText: aiThemeColors.primaryText,
        border: aiThemeColors.border,
    },

    // 文件查看器样式
    fileViewer: {
        background: aiThemeColors.cardBackground,
        border: aiThemeColors.borderLight,
        text: aiThemeColors.primaryText,
    },

    // 代码背景
    codeBackground: aiThemeColors.codeBackground,

    // 工具栏样式
    toolbar: {
        background: aiThemeColors.bodyBackground,
        border: aiThemeColors.border,
        text: aiThemeColors.primaryText,
    },

    // 状态样式配置 - 深色模式完美适配
    status: {
        error: {
            background: 'var(--mantine-color-red-light)',
            border: 'var(--mantine-color-red-outline)',
            text: 'var(--mantine-color-red-light-color)',
            textSecondary: 'var(--mantine-color-red-light-color)',
            textLight: 'var(--mantine-color-red-light-color)',
            icon: 'var(--mantine-color-red-light-color)',
            progressColor: 'red',
        },
        warning: {
            background: 'var(--mantine-color-yellow-light)',
            border: 'var(--mantine-color-yellow-outline)',
            text: 'var(--mantine-color-yellow-light-color)',
            textSecondary: 'var(--mantine-color-yellow-light-color)',
            textLight: 'var(--mantine-color-yellow-light-color)',
            icon: 'var(--mantine-color-yellow-light-color)',
            progressColor: 'yellow',
        },
        success: {
            background: 'var(--mantine-color-green-light)',
            border: 'var(--mantine-color-green-outline)',
            text: 'var(--mantine-color-green-light-color)',
            textSecondary: 'var(--mantine-color-green-light-color)',
            textLight: 'var(--mantine-color-green-light-color)',
            icon: 'var(--mantine-color-green-light-color)',
            progressColor: 'green',
        },
        info: {
            background: 'var(--mantine-color-blue-light)',
            border: 'var(--mantine-color-blue-outline)',
            text: 'var(--mantine-color-blue-light-color)',
            textSecondary: 'var(--mantine-color-blue-light-color)',
            textLight: 'var(--mantine-color-blue-light-color)',
            icon: 'var(--mantine-color-blue-light-color)',
            progressColor: 'blue',
        },
    },

    // 文字颜色标准化系统 - 深色模式优化
    text: {
        // 主要文字级别
        primary: aiThemeColors.primaryText, // 主标题、重要内容
        heading: aiThemeColors.headingText, // 页面标题、section标题
        subtitle: 'var(--mantine-color-gray-7)', // 副标题，清晰但次要

        // 次要文字级别
        secondary: aiThemeColors.secondaryText, // 正文内容
        caption: 'var(--mantine-color-gray-6)', // 说明文字，比dimmed更清晰
        label: 'var(--mantine-color-gray-7)', // 标签文字

        // 弱化文字级别
        muted: 'var(--mantine-color-gray-6)', // 静音文字，深色模式优化
        placeholder: aiThemeColors.placeholderText, // 占位符文字
        disabled: 'var(--mantine-color-gray-5)', // 禁用状态文字

        // 状态文字
        success: aiThemeColors.success,
        warning: aiThemeColors.warning,
        error: aiThemeColors.error,
        info: aiThemeColors.info,
    },
};

/**
 * 标准化文字颜色使用指南
 *
 * 使用场景：
 * - text.primary: 最重要的文字内容，如数据值、用户输入内容
 * - text.heading: 页面标题、section标题（如"AI Assistant"）
 * - text.subtitle: 副标题、卡片标题（如消息时间戳）
 * - text.secondary: 正文描述、一般性说明文字
 * - text.caption: 简短说明、提示文字（如文件大小）
 * - text.label: 表单标签、按钮标签
 * - text.muted: 不太重要的补充信息（如连接状态）
 * - text.placeholder: 输入框占位符
 * - text.disabled: 禁用状态的文字
 */
