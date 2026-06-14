import { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Map,
  List,
  ClipboardCheck,
  Wrench,
  BarChart3,
  Waypoints,
  Sun,
  Moon,
  PanelLeft,
  Users,
  MessageSquare,
  Image,
  UsersRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';

// 顶部导航项配置
const navItems = [
  { to: '/', label: '地图浏览', icon: Map },
  { to: '/list', label: '作品列表', icon: List },
  { to: '/inspections', label: '巡查管理', icon: ClipboardCheck },
  { to: '/maintenance', label: '维护记录', icon: Wrench },
  { to: '/volunteers', label: '志愿者', icon: Users },
  { to: '/comments', label: '评论管理', icon: MessageSquare },
  { to: '/community', label: '公众参与', icon: UsersRound },
  { to: '/photos', label: '照片管理', icon: Image },
  { to: '/analytics', label: '数据看板', icon: BarChart3 },
  { to: '/path', label: '导览路线', icon: Waypoints },
];

// Layout 组件 Props
interface LayoutProps {
  children?: ReactNode;
}

// 主布局组件：包含顶部导航栏、侧边栏和主内容区
export default function Layout({ children }: LayoutProps) {
  const { theme, sidebarOpen, toggleTheme, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="h-full px-4 flex items-center justify-between">
          {/* 左侧：Logo + 侧边栏切换按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="切换侧边栏"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Map className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                城市艺术品管理
              </span>
            </div>
          </div>

          {/* 右侧：导航菜单 + 主题切换 */}
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* 主题切换按钮 */}
            <button
              onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="切换主题"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 */}
        <aside
          className={cn(
            'sticky top-16 h-[calc(100vh-4rem)] shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 overflow-hidden',
            sidebarOpen ? 'w-64' : 'w-0'
          )}
        >
          <div className="w-64 h-full p-4">
            {/* 移动端/响应式导航 */}
            <nav className="flex flex-col gap-1 md:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* 侧边栏内容占位（可扩展：筛选面板、快捷操作等） */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
                快捷操作
              </h3>
              <div className="space-y-1">
                {/* 侧边栏菜单项占位 */}
              </div>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 min-w-0">
          <div className="p-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
