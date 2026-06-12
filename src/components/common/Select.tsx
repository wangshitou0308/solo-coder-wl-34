import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// 下拉选项类型
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Select 组件 Props
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
}

// 通用下拉选择框组件
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftIcon,
      options = [],
      placeholder,
      disabled,
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name || `select-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="w-full">
        {/* 标签 */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
          >
            {label}
          </label>
        )}

        {/* 下拉框容器 */}
        <div className="relative">
          {/* 左侧图标 */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
              {leftIcon}
            </div>
          )}

          {/* 下拉选择框 */}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            className={cn(
              'w-full h-10 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              'px-3 pr-10 text-sm transition-colors duration-200 appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400',
              leftIcon && 'pl-10',
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-500 dark:focus:ring-red-400'
                : 'border-gray-300 dark:border-gray-600',
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700',
              className
            )}
            {...props}
          >
            {/* 占位选项 */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {/* 通过 options 传入的选项 */}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
            {/* 通过 children 传入的自定义选项 */}
            {children}
          </select>

          {/* 右侧下拉箭头图标 */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* 错误提示文字 */}
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* 辅助说明文字 */}
        {!error && helperText && (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
