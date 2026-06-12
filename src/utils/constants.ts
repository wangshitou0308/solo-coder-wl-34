/**
 * 城市公共艺术系统常量配置
 * 包含颜色映射、选项列表、枚举映射等全局常量
 */

import { ArtworkType, InspectionStatus } from '@/types'

/** 作品类型颜色映射 */
export const TYPE_COLORS: Record<ArtworkType, string> = {
  [ArtworkType.SCULPTURE]: '#0d9488',
  [ArtworkType.MURAL]: '#8b5cf6',
  [ArtworkType.INSTALLATION]: '#f59e0b',
  [ArtworkType.FOUNTAIN]: '#0ea5e9',
  [ArtworkType.MONUMENT]: '#ef4444',
  [ArtworkType.GRAFFITI]: '#22c55e'
}

/** 作品类型背景色(透明度15%) */
export const TYPE_BG_COLORS: Record<ArtworkType, string> = {
  [ArtworkType.SCULPTURE]: 'rgba(13, 148, 136, 0.15)',
  [ArtworkType.MURAL]: 'rgba(139, 92, 246, 0.15)',
  [ArtworkType.INSTALLATION]: 'rgba(245, 158, 11, 0.15)',
  [ArtworkType.FOUNTAIN]: 'rgba(14, 165, 233, 0.15)',
  [ArtworkType.MONUMENT]: 'rgba(239, 68, 68, 0.15)',
  [ArtworkType.GRAFFITI]: 'rgba(34, 197, 94, 0.15)'
}

/** 巡查状态颜色映射 */
export const STATUS_COLORS: Record<InspectionStatus, string> = {
  [InspectionStatus.GOOD]: '#22c55e',
  [InspectionStatus.MINOR]: '#84cc16',
  [InspectionStatus.MODERATE]: '#f59e0b',
  [InspectionStatus.SEVERE]: '#ef4444',
  [InspectionStatus.DEMOLISHED]: '#6b7280'
}

/** 巡查状态背景色(透明度15%) */
export const STATUS_BG_COLORS: Record<InspectionStatus, string> = {
  [InspectionStatus.GOOD]: 'rgba(34, 197, 94, 0.15)',
  [InspectionStatus.MINOR]: 'rgba(132, 204, 22, 0.15)',
  [InspectionStatus.MODERATE]: 'rgba(245, 158, 11, 0.15)',
  [InspectionStatus.SEVERE]: 'rgba(239, 68, 68, 0.15)',
  [InspectionStatus.DEMOLISHED]: 'rgba(107, 114, 128, 0.15)'
}

/** 问题标签选项 */
export const ISSUE_OPTIONS: string[] = [
  '涂鸦覆盖',
  '金属锈蚀',
  '结构松动',
  '石材风化',
  '植被侵入',
  '灯具损坏',
  '基座破损'
]

/** 问题标签说明映射 */
export const ISSUE_DESCRIPTIONS: Record<string, string> = {
  '涂鸦覆盖': '作品表面被未经授权的涂鸦覆盖，影响外观',
  '金属锈蚀': '金属部件出现氧化锈蚀，可能影响结构安全',
  '结构松动': '连接部件或整体结构出现松动，存在安全隐患',
  '石材风化': '石材表面出现风化、侵蚀、剥落等现象',
  '植被侵入': '植物根系或藤蔓侵入作品结构，造成损坏',
  '灯具损坏': '配套照明设施出现故障或损坏',
  '基座破损': '作品基座出现裂纹、破损或沉降'
}

/** 区域列表选项 */
export const DISTRICT_OPTIONS: string[] = [
  '东城区',
  '西城区',
  '朝阳区',
  '海淀区',
  '丰台区'
]

/** 区域详细信息 */
export const DISTRICT_INFO: Record<string, { center: [number, number]; area: number; population: string }> = {
  '东城区': { center: [39.9283, 116.4163], area: 41.84, population: '70.9万' },
  '西城区': { center: [39.9127, 116.3659], area: 50.53, population: '110.6万' },
  '朝阳区': { center: [39.9219, 116.4437], area: 470.8, population: '345.2万' },
  '海淀区': { center: [39.9593, 116.2981], area: 430.77, population: '313.3万' },
  '丰台区': { center: [39.8587, 116.2871], area: 306, population: '201.5万' }
}

/** 材质选项 */
export const MATERIAL_OPTIONS: string[] = [
  '青铜',
  '大理石',
  '花岗岩',
  '不锈钢',
  '陶瓷',
  '玻璃纤维',
  '混凝土',
  '马赛克'
]

/** 材质特性说明 */
export const MATERIAL_PROPERTIES: Record<string, { durability: number; maintenanceCost: string; weatherResistance: string }> = {
  '青铜': { durability: 90, maintenanceCost: '高', weatherResistance: '优秀' },
  '大理石': { durability: 70, maintenanceCost: '中', weatherResistance: '一般' },
  '花岗岩': { durability: 95, maintenanceCost: '低', weatherResistance: '优秀' },
  '不锈钢': { durability: 85, maintenanceCost: '低', weatherResistance: '良好' },
  '陶瓷': { durability: 60, maintenanceCost: '中', weatherResistance: '一般' },
  '玻璃纤维': { durability: 50, maintenanceCost: '中', weatherResistance: '一般' },
  '混凝土': { durability: 80, maintenanceCost: '低', weatherResistance: '良好' },
  '马赛克': { durability: 75, maintenanceCost: '中', weatherResistance: '良好' }
}

/** 作品类型列表(用于下拉选择等) */
export const ARTWORK_TYPE_OPTIONS: ArtworkType[] = [
  ArtworkType.SCULPTURE,
  ArtworkType.MURAL,
  ArtworkType.INSTALLATION,
  ArtworkType.FOUNTAIN,
  ArtworkType.MONUMENT,
  ArtworkType.GRAFFITI
]

/** 巡查状态列表(用于下拉选择等) */
export const INSPECTION_STATUS_OPTIONS: InspectionStatus[] = [
  InspectionStatus.GOOD,
  InspectionStatus.MINOR,
  InspectionStatus.MODERATE,
  InspectionStatus.SEVERE,
  InspectionStatus.DEMOLISHED
]

/** 维护类型选项 */
export const MAINTENANCE_TYPE_OPTIONS: string[] = [
  '日常维护',
  '修复工程',
  '翻新改造',
  '紧急抢修'
]

/** 维护状态选项 */
export const MAINTENANCE_STATUS_OPTIONS: string[] = [
  '待开始',
  '进行中',
  '已完成',
  '已取消'
]

/** 志愿者等级选项 */
export const VOLUNTEER_LEVEL_OPTIONS: string[] = [
  '初级',
  '中级',
  '高级',
  '专家'
]

/** 志愿者状态选项 */
export const VOLUNTEER_STATUS_OPTIONS: string[] = [
  '活跃',
  '休息中',
  '已注销'
]

/** 照片审核状态选项 */
export const AUDIT_STATUS_OPTIONS: string[] = [
  '待审核',
  '已通过',
  '已拒绝'
]

/** 默认分页设置 */
export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20
} as const

/** 地图默认中心坐标(北京市中心) */
export const DEFAULT_MAP_CENTER: [number, number] = [39.9042, 116.4074]

/** 地图默认缩放级别 */
export const DEFAULT_MAP_ZOOM = 12

/** 步行速度(公里/小时) - 用于估算步行时间 */
export const WALKING_SPEED_KMH = 5

/** 志愿者等级对应的服务时长要求(小时) */
export const VOLUNTEER_LEVEL_REQUIREMENTS: Record<string, number> = {
  '初级': 0,
  '中级': 50,
  '高级': 200,
  '专家': 500
}
