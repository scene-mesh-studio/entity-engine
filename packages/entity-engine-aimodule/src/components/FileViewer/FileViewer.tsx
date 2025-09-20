// 'use client' directive is added by tsup banner

/**
 * Entity Engine AI - FileViewer Component
 * 
 * 文件查看器组件
 * 支持图片预览、文档显示和文件操作
 */



import type { FileViewerProps } from '../../types';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Text, Modal, Title, Group, Stack, Paper, Badge, Image, Button, ActionIcon } from '@mantine/core';
import { 
  X, 
  Eye, 
  File, 
  Code, 
  Music,
  Video,
  Archive,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';

import { componentStyles, getThemedTextProps } from '../../utils/theme';

/**
 * 文件查看器组件
 */
export function FileViewer({
  file,
  showDownload = false,
  showRemove = false,
  onRemove,
  className,
}: FileViewerProps) {
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get file info
  const fileInfo = useMemo(() => {
    const extension = file.filename?.split('.').pop()?.toLowerCase() || '';
    const mediaType = file.mediaType || '';
    
    // Determine file type category
    let category = 'document';
    let icon = <File className="w-5 h-5" />;
    let color = 'text-gray-600 dark:text-gray-400';
    let bgColor = 'bg-gray-100 dark:bg-gray-800';

    if (mediaType.startsWith('image/')) {
      category = 'image';
      icon = <Image className="w-5 h-5" />;
      color = 'text-blue-600 dark:text-blue-400';
      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
    } else if (mediaType.startsWith('text/') || ['txt', 'md', 'json', 'xml', 'csv'].includes(extension)) {
      category = 'text';
      icon = <FileText className="w-5 h-5" />;
      color = 'text-green-600 dark:text-green-400';
      bgColor = 'bg-green-50 dark:bg-green-900/20';
    } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'php'].includes(extension)) {
      category = 'code';
      icon = <Code className="w-5 h-5" />;
      color = 'text-purple-600 dark:text-purple-400';
      bgColor = 'bg-purple-50 dark:bg-purple-900/20';
    } else if (mediaType.startsWith('audio/')) {
      category = 'audio';
      icon = <Music className="w-5 h-5" />;
      color = 'text-pink-600 dark:text-pink-400';
      bgColor = 'bg-pink-50 dark:bg-pink-900/20';
    } else if (mediaType.startsWith('video/')) {
      category = 'video';
      icon = <Video className="w-5 h-5" />;
      color = 'text-red-600 dark:text-red-400';
      bgColor = 'bg-red-50 dark:bg-red-900/20';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      category = 'archive';
      icon = <Archive className="w-5 h-5" />;
      color = 'text-orange-600 dark:text-orange-400';
      bgColor = 'bg-orange-50 dark:bg-orange-900/20';
    }

    return {
      extension,
      category,
      icon,
      color,
      bgColor,
      canPreview: ['image', 'text'].includes(category),
      size: formatFileSize(getFileSizeFromUrl(file.url)),
    };
  }, [file]);

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Get file size from URL (approximation for blob URLs)
  function getFileSizeFromUrl(url: string): number {
    // For blob URLs, we can't determine the actual size
    // Return 0 and let the parent component provide size if needed
    return 0;
  }

  // Handle download
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(downloadUrl);
    } catch {
      // Ignore download errors
    } finally {
      setIsLoading(false);
    }
  };

  // Handle remove
  const handleRemove = () => {
    if (onRemove) {
      onRemove(file);
    }
  };

  // Render file preview content
  const renderPreviewContent = () => {
    if (fileInfo.category === 'image') {
      return (
        <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxHeight: '24rem' }}>
          <Image
            src={file.url}
            alt={file.filename}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            radius="md"
            onError={() => setImageLoadError(true)}
          />
        </Box>
      );
    }

    if (fileInfo.category === 'text') {
      return (
        <Box style={{ maxHeight: '24rem', overflow: 'auto' }}>
          <iframe
            src={file.url}
            style={{ 
              width: '100%', 
              height: '20rem',
              border: `1px solid ${componentStyles.fileViewer.border}`,
              borderRadius: '0.5rem'
            }}
            title={file.filename}
          />
        </Box>
      );
    }

    return (
      <Stack align="center" justify="center" style={{ padding: '2rem' }}>
        <AlertTriangle size={48} color={componentStyles.text.muted} />
        <Text {...getThemedTextProps('muted')}>Preview not available for this file type</Text>
        <Text size="sm" {...getThemedTextProps('muted')}>Click download to view the file</Text>
      </Stack>
    );
  };

  return (
    <>
      {/* File Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Paper
          p="md"
          style={{
            position: 'relative',
            border: `1px solid ${componentStyles.fileViewer.border}`,
            borderRadius: '0.5rem',
            backgroundColor: componentStyles.fileViewer.background,
            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            transition: 'box-shadow 0.2s'
          }}
        >
          {/* Remove Button */}
          {showRemove && (
            <ActionIcon
              size="sm"
              color="red"
              variant="filled"
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                opacity: 0.7
              }}
              title="Remove file"
            >
              <X size={12} />
            </ActionIcon>
          )}

          {/* File Content */}
          <Group align="flex-start" gap="sm">
            {/* File Icon/Thumbnail */}
            <Box style={{ flexShrink: 0 }}>
              {fileInfo.category === 'image' && !imageLoadError ? (
                <Box
                  w={48}
                  h={48}
                  style={{
                    borderRadius: '0.25rem',
                    overflow: 'hidden',
                    backgroundColor: componentStyles.codeBackground
                  }}
                >
                  <Image
                    src={file.url}
                    alt={file.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImageLoadError(true)}
                  />
                </Box>
              ) : (
                <Box
                  w={48}
                  h={48}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {fileInfo.icon}
                </Box>
              )}
            </Box>

            {/* File Info */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} {...getThemedTextProps('primary')} truncate>
                {file.filename}
              </Text>
              <Group gap="xs" mt="xs">
                <Badge size="xs" variant="light" color="gray">
                  {fileInfo.extension || 'Unknown'}
                </Badge>
                {fileInfo.size !== '0 B' && (
                  <Text size="xs" {...getThemedTextProps('muted')}>
                    {fileInfo.size}
                  </Text>
                )}
              </Group>

              {/* Media Type */}
              {file.mediaType && (
                <Text size="xs" {...getThemedTextProps('muted')} mt="xs">
                  {file.mediaType}
                </Text>
              )}
            </Box>
          </Group>

          {/* Action Buttons */}
          <Group justify="flex-end" gap="xs" mt="sm" style={{ opacity: 0.7 }}>
            {/* Preview Button */}
            {fileInfo.canPreview && (
              <Button
                variant="subtle"
                size="xs"
                onClick={() => setIsPreviewOpen(true)}
                leftSection={<Eye size={12} />}
              >
                Preview
              </Button>
            )}

            {/* Download Button */}
            {showDownload && (
              <Button
                variant="subtle"
                size="xs"
                onClick={handleDownload}
                disabled={isLoading}
                leftSection={<Download size={12} />}
              >
                {isLoading ? 'Downloading...' : 'Download'}
              </Button>
            )}
          </Group>
        </Paper>
      </motion.div>

      {/* Preview Modal with Animation */}
      <AnimatePresence>
        {isPreviewOpen && (
          <Modal 
            opened={isPreviewOpen} 
            onClose={() => setIsPreviewOpen(false)}
            size="xl"
            styles={{
              content: { maxHeight: '90vh' },
              body: { overflow: 'auto' }
            }}
          >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Group gap="sm" mb="md">
                  <Box>
                    {fileInfo.icon}
                  </Box>
                  <Title order={3} {...getThemedTextProps('heading')}>
                    {file.filename}
                  </Title>
                </Group>
          
                <Box mt="md">
                  {renderPreviewContent()}
                </Box>

                {/* Preview Actions */}
                <Group justify="flex-end" gap="sm" mt="md" pt="md" style={{ borderTop: `1px solid ${componentStyles.fileViewer.border}` }}>
                  <Button
                    onClick={handleDownload}
                    disabled={isLoading}
                    leftSection={<Download size={16} />}
                  >
                    {isLoading ? 'Downloading...' : 'Download'}
                  </Button>
                </Group>
              </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * 默认导出FileViewer组件
 */
export default FileViewer;