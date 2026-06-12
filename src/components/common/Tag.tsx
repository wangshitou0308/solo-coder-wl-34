import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// 预设颜色类型
export type TagColor =
  | 'teal'
  | 'amber'
  | 'red'
  | 'green'
  | 'blue'
  | 'purple'
  | 'gray';

// Tag 组件 Props
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  color?: TagColor;
  children: ReactNode;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

// 颜色样式映射
const colorClasses: Record<TagColor, string> = {
  teal: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 border-primary-200 dark:border-primary-800',
  amber: 'bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300 border-accent-200 dark:border-accent-800',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600',
};

// 圆角样式映射
const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

// 彩色标签组件，用于展示分类、状态等信息
export default function Tag({
  color = 'teal',
  rounded = 'full',
  className,
  children,
  ...props
}: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-xs font-medium',
        colorClasses[color],
        roundedClasses[rounded],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
