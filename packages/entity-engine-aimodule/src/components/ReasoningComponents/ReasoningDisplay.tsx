/**
 * 🧠 推理显示UI组件
 * 
 * Implementation based on reasoning model specifications
 * 支持DeepSeek和Anthropic推理模型
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReasoningDisplayProps {
  reasoningText: string;
  isStreaming?: boolean;
  className?: string;
  defaultExpanded?: boolean;
  showToggle?: boolean;
}

export const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({
  reasoningText,
  isStreaming = false,
  className = '',
  defaultExpanded = false,
  showToggle = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showReasoning, setShowReasoning] = useState(true);

  return (
    <div className={`reasoning-container ${className}`}>
      {/* 推理状态指示器 */}
      <div className="reasoning-header">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="reasoning-toggle"
          disabled={!showToggle}
        >
          <div className="reasoning-icon">
            {isStreaming ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="reasoning-spinner"
              >
                🧠
              </motion.div>
            ) : (
              <span className="reasoning-brain">🧠</span>
            )}
          </div>
          <span className="reasoning-label">
            {isStreaming ? 'AI正在思考...' : 'AI推理过程'}
          </span>
          {showToggle && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="reasoning-chevron"
            >
              ▼
            </motion.div>
          )}
        </button>

        {showToggle && (
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="reasoning-visibility-toggle"
            title={showReasoning ? '隐藏推理' : '显示推理'}
          >
            {showReasoning ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
      </div>

      {/* Reasoning content display */}
      <AnimatePresence>
        {isExpanded && showReasoning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="reasoning-content"
          >
            {/* Using <pre> tag for reasoning content display */}
            <pre className="reasoning-text">{reasoningText}</pre>
            
            {isStreaming && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="reasoning-stream-indicator"
              >
                ▋
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 推理流式显示Hook
export const useReasoningStream = () => {
  const [reasoningState, setReasoningState] = useState({
    currentReasoning: '',
    isReasoningActive: false,
    reasoningHistory: [] as string[],
  });

  const handleReasoningPart = React.useCallback((part: any) => {
    if (part.type === 'reasoning') {
      setReasoningState(prev => ({
        ...prev,
        currentReasoning: part.text,
        isReasoningActive: true,
      }));
    }
  }, []);

  const finishReasoning = React.useCallback(() => {
    setReasoningState(prev => ({
      currentReasoning: '',
      isReasoningActive: false,
      reasoningHistory: [...prev.reasoningHistory, prev.currentReasoning],
    }));
  }, []);

  return {
    reasoningState,
    handleReasoningPart,
    finishReasoning,
  };
};