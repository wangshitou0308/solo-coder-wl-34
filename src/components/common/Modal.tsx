import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './Button';

// Modal 组件 Props
export interface ModalProps {
  open: boolean;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  className?: string;
}

// 宽度样式映射
const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
} as const;

// 通用弹框组件
export default function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  width = 'md',
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  // 监听 ESC 键关闭弹框
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => closeOnOverlayClick && onClose()}
      />

      {/* 弹框内容 */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl',
          'flex flex-col max-h-[calc(100vh-2rem)]',
          'animate-in fade-in zoom-in-95 duration-200',
          widthClasses[width],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* 头部 */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto -mr-2"
                onClick={onClose}
                aria-label="关闭"
                leftIcon={<X className="w-4 h-4" />}
              />
            )}
          </div>
        )}

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* 底部 */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
