import { forwardRef, TextareaHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Textarea 组件 Props
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  showCount?: boolean;
  maxLength?: number;
}

// 通用多行文本输入框组件
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      disabled,
      id,
      showCount,
      maxLength,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name || `textarea-${Math.random().toString(36).slice(2, 9)}`;

    // 计算当前字符数
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {/* 标签 */}
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              {label}
            </label>
            {/* 字数统计 */}
            {showCount && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentLength}
                {maxLength && ` / ${maxLength}`}
              </span>
            )}
          </div>
        )}

        {/* 文本域 */}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          maxLength={maxLength}
          value={value}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
              ? `${textareaId}-helper`
              : undefined
          }
          className={cn(
            'w-full min-h-[100px] rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'px-3 py-2 text-sm transition-colors duration-200 resize-y',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-400'
              : 'border-gray-300 dark:border-gray-600',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
            className
          )}
          {...props}
        />

        {/* 底部辅助信息：错误文字 / 辅助说明 / 字数统计 */}
        <div className="flex items-center justify-between mt-1.5 min-h-[1.25rem]">
          <div>
            {/* 错误提示文字 */}
            {error && (
              <p
                id={`${textareaId}-error`}
                className="text-xs text-red-600 dark:text-red-400"
                role="alert"
              >
                {error}
              </p>
            )}
            {/* 辅助说明文字 */}
            {!error && helperText && (
              <p
                id={`${textareaId}-helper`}
                className="text-xs text-gray-500 dark:text-gray-400"
              >
                {helperText}
              </p>
            )}
          </div>
          {/* 底部字数统计（当 label 未显示时展示在这里） */}
          {!label && showCount && (
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {currentLength}
              {maxLength && ` / ${maxLength}`}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
