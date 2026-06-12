import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

// Empty 组件 Props
export interface EmptyProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// 空状态组件，用于列表无数据时展示
export default function Empty({
  title = '暂无数据',
  description,
  icon,
  action,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* 图标 */}
      <div className="mb-4 w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {icon || (
          <Inbox className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        )}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>

      {/* 描述文字 */}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
