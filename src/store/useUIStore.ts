import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主题类型
export type Theme = 'light' | 'dark';

// UI 状态管理
// theme: 主题（亮色/暗色）
// sidebarOpen: 侧边栏是否展开
export interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
}

// UI 操作方法
export interface UIActions {
  toggleTheme: () => void;
  toggleSidebar: () => void;
}

// 创建 UI Store（使用 persist 中间件持久化到 localStorage）
export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,

      // 切换主题
      toggleTheme: () => {
        const nextTheme: Theme = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(nextTheme);
        set({ theme: nextTheme });
      },

      // 切换侧边栏展开/收起
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ui-storage',
      // 初始化时同步主题到 DOM
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(state.theme);
        }
      },
    }
  )
);
