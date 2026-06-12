import { create } from 'zustand';

// 筛选状态管理
// types: 类型筛选数组
// materials: 材质筛选数组
// yearRange: 年份范围 [开始年, 结束年]
// district: 区域筛选
// status: 状态筛选
export interface FilterState {
  types: string[];
  materials: string[];
  yearRange: [number, number] | null;
  district: string | null;
  status: string | null;
}

// 筛选操作方法
export interface FilterActions {
  setTypes: (types: string[]) => void;
  setMaterials: (materials: string[]) => void;
  setYearRange: (range: [number, number] | null) => void;
  setDistrict: (district: string | null) => void;
  setStatus: (status: string | null) => void;
  reset: () => void;
}

// 初始状态
const initialState: FilterState = {
  types: [],
  materials: [],
  yearRange: null,
  district: null,
  status: null,
};

// 创建筛选 Store
export const useFilterStore = create<FilterState & FilterActions>((set) => ({
  ...initialState,

  // 设置类型筛选
  setTypes: (types) => set({ types }),

  // 设置材质筛选
  setMaterials: (materials) => set({ materials }),

  // 设置年份范围
  setYearRange: (yearRange) => set({ yearRange }),

  // 设置区域筛选
  setDistrict: (district) => set({ district }),

  // 设置状态筛选
  setStatus: (status) => set({ status }),

  // 重置所有筛选条件
  reset: () => set(initialState),
}));
