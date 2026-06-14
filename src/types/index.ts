/**
 * 城市公共艺术系统类型定义
 * 包含从数据库模块的重新导出以及枚举、扩展接口定义
 */

/** 从数据库模块重新导出基础类型 */
export type {
  Artwork,
  Inspection,
  Maintenance,
  Comment,
  Photo,
  UserPhoto,
  Volunteer,
  Setting,
  Submission,
  Favorite,
  Feedback,
  PublicArtDB,
  PublicArtDBSchema,
} from '../db';

export type { ArtworkFilter } from '../db/repositories/artwork';

/** 作品类型枚举 */
export enum ArtworkType {
  /** 雕塑 */
  SCULPTURE = '雕塑',
  /** 壁画 */
  MURAL = '壁画',
  /** 装置 */
  INSTALLATION = '装置',
  /** 喷泉 */
  FOUNTAIN = '喷泉',
  /** 纪念碑 */
  MONUMENT = '纪念碑',
  /** 涂鸦 */
  GRAFFITI = '涂鸦'
}

/** 巡查状态枚举 */
export enum InspectionStatus {
  /** 完好 */
  GOOD = '完好',
  /** 轻微 */
  MINOR = '轻微',
  /** 中等 */
  MODERATE = '中等',
  /** 严重 */
  SEVERE = '严重',
  /** 已拆除 */
  DEMOLISHED = '已拆除'
}

/** 投稿状态枚举 */
export enum SubmissionStatus {
  /** 待审核 */
  PENDING = 'pending',
  /** 已通过 */
  APPROVED = 'approved',
  /** 已拒绝 */
  REJECTED = 'rejected'
}

/** 反馈类型枚举 */
export enum FeedbackType {
  /** 位置错误 */
  LOCATION = 'location',
  /** 信息错误 */
  INFO = 'info',
  /** 照片错误 */
  PHOTO = 'photo',
  /** 状态异常 */
  STATUS = 'status',
  /** 其他 */
  OTHER = 'other'
}

/** 反馈状态枚举 */
export enum FeedbackStatus {
  /** 待处理 */
  PENDING = 'pending',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 已解决 */
  RESOLVED = 'resolved',
  /** 已拒绝 */
  REJECTED = 'rejected'
}

/** 照片分类枚举 */
export enum PhotoCategory {
  /** 全景 */
  PANORAMA = '全景',
  /** 局部细节 */
  DETAIL = '局部',
  /** 铭牌特写 */
  PLAQUE = '铭牌',
  /** 修缮前 */
  BEFORE_RESTORE = '修缮前',
  /** 修缮后 */
  AFTER_RESTORE = '修缮后',
  /** 用户上传 */
  USER_UPLOAD = '用户上传'
}

/** 地图图层类型枚举 */
export enum MapLayerType {
  /** 作品类型图层 */
  TYPE = 'type',
  /** 状态风险图层 */
  RISK = 'risk',
  /** 巡查覆盖图层 */
  COVERAGE = 'coverage',
  /** 热门作品图层 */
  POPULAR = 'popular'
}

/** 坐标点接口 */
export interface Coordinates {
  /** 纬度 */
  latitude: number
  /** 经度 */
  longitude: number
}

/** 筛选选项接口 */
export interface FilterOptions {
  /** 作品类型筛选 */
  types?: ArtworkType[]
  /** 巡查状态筛选 */
  statuses?: InspectionStatus[]
  /** 区域筛选 */
  districts?: string[]
  /** 材质筛选 */
  materials?: string[]
  /** 创建年份范围 */
  yearRange?: [number, number]
  /** 估值范围(元) */
  valuationRange?: [number, number]
  /** 关键词搜索 */
  keyword?: string
  /** 排序字段 */
  sortBy?: 'name' | 'year' | 'createdAt' | 'valuation'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
  /** 当前页码 */
  page?: number
  /** 每页数量 */
  pageSize?: number
}
