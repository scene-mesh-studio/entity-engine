import React from 'react';
import {
    Eye as IconEye,
    Tag as IconTag,
    Bed as IconBed,
    Plus as IconPlus,
    List as IconList,
    Edit as IconEdit,
    Copy as IconCopy,
    File as IconFile,
    Hash as IconHash,
    Code as IconCode,
    Link as IconLink,
    Text as IconText,
    Trash as IconTrash,
    Share as IconShare,
    Search as IconSearch,
    Upload as IconUpload,
    BarChart as IconChart,
    Grid3X3 as IconWidget,
    XCircle as IconCircleX,
    Info as IconInfoCircle,
    EyeOff as IconEyeClosed,
    Settings as IconSettings,
    FileText as IconFileText,
    RefreshCw as IconRefresh,
    Calendar as IconCalendar,
    Database as IconDatabase,
    ChevronUp as IconChevronUp,
    FolderPlus as IconFolderPlus,
    ArrowUp as IconSortAscending,
    ArrowRight as IconArrowRight,
    CheckSquare as IconChecklist,
    CheckCircle as IconCircleCheck,
    ChevronDown as IconChevronDown,
    MoreVertical as IconDotsVertical,
    FlipHorizontal as IconFlipHorizontal,
} from 'lucide-react';

// Solar到Tabler图标的映射
export const ICON_MAPPING = {
    // 基础图标
    'solar:settings-bold': IconSettings,
    'solar:add-folder-bold': IconFolderPlus,
    'solar:add-circle-bold': IconPlus,
    'solar:list-bold': IconList,
    'solar:eye-bold': IconEye,
    'solar:eye-closed-bold': IconEyeClosed,
    'solar:check-circle-bold': IconCircleCheck,
    'solar:close-circle-bold': IconCircleX,
    'solar:trash-bin-trash-bold': IconTrash,
    'solar:pen-bold': IconEdit,
    'solar:info-circle-bold': IconInfoCircle,
    'solar:copy-bold': IconCopy,
    'solar:share-bold': IconShare,
    'solar:restart-bold': IconRefresh,
    'solar:file-bold': IconFile,
    'solar:refresh-bold': IconRefresh,
    'solar:database-bold': IconDatabase,
    'solar:tag-bold': IconTag,
    'solar:widget-bold': IconWidget,
    'solar:bed-bold': IconBed,
    'solar:text-bold': IconText,

    // 箭头和方向图标
    'solar:arrow-right-bold': IconArrowRight,
    'solar:alt-arrow-up-bold': IconChevronUp,
    'solar:alt-arrow-down-bold': IconChevronDown,
    'solar:mirror-left-bold': IconFlipHorizontal,

    // 操作图标
    'solar:sort-by-time-bold': IconSortAscending,
    'solar:document-text-bold': IconFileText,
    'solar:magnifer-bold': IconSearch,
    'solar:import-bold': IconUpload,
    'solar:chart-bold': IconChart,
    'solar:checklist-bold': IconChecklist,

    // 字段类型图标
    'solar:text-field-bold': IconFileText,
    'solar:hashtag-bold': IconHash,
    'solar:calendar-bold': IconCalendar,
    'solar:code-bold': IconCode,
    'solar:link-bold': IconLink,
    'solar:document-bold': IconFileText,

    // 其他图标
    'mdi:dots-vertical': IconDotsVertical,
    'eva:chevron-down-fill': IconChevronDown,
} as const;

// 通用图标组件
export interface IconProps {
    icon?: string;
    size?: number;
    width?: number;
    height?: number;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
}

export const Icon: React.FC<IconProps> = ({
    icon,
    size = 24,
    width,
    height,
    color = 'currentColor',
    style,
    className,
    ...props
}) => {
    const iconSize = width || height || size;

    if (!icon) {
        return null;
    }

    const IconComponent = ICON_MAPPING[icon as keyof typeof ICON_MAPPING];

    if (!IconComponent) {
        return (
            <IconFile
                size={iconSize}
                color={color}
                style={style}
                className={className}
                {...props}
            />
        );
    }

    return (
        <IconComponent
            size={iconSize}
            color={color}
            style={style}
            className={className}
            {...props}
        />
    );
};

export default Icon;
