/**
 * Entity Engine AI - Components Export
 * 
 * 统一导出所有UI组件
 */

// 主要组件
export { ChatDialog } from './ChatDialog/ChatDialog';
export { FileViewer } from './FileViewer/FileViewer';
export { MessageBubble } from './MessageBubble/MessageBubble';

// 重新导出组件相关类型
export type {
  ChatDialogProps,
  FileViewerProps,
  MessageBubbleProps,
} from '../types/ui-types';