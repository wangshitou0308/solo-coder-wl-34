/**
 * 地理位置工具函数
 * 提供距离计算、路径规划、步行时间估算等功能
 */

import { Coordinates } from '@/types'
import { WALKING_SPEED_KMH } from './constants'

/** 地球平均半径(单位:公里) */
const EARTH_RADIUS_KM = 6371

/**
 * 将角度转换为弧度
 * @param degrees 角度值
 * @returns 弧度值
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * 使用Haversine公式计算两点之间的大圆距离
 * @param point1 第一个点的坐标
 * @param point2 第二个点的坐标
 * @returns 两点之间的距离(单位:公里)
 */
export function haversineDistance(point1: Coordinates, point2: Coordinates): number {
  const lat1 = toRadians(point1.latitude)
  const lon1 = toRadians(point1.longitude)
  const lat2 = toRadians(point2.latitude)
  const lon2 = toRadians(point2.longitude)

  const dLat = lat2 - lat1
  const dLon = lon2 - lon1

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

/**
 * 计算两点之间的距离(单位:米)
 * @param point1 第一个点的坐标
 * @param point2 第二个点的坐标
 * @returns 距离(单位:米)
 */
export function calculateDistanceMeters(point1: Coordinates, point2: Coordinates): number {
  return haversineDistance(point1, point2) * 1000
}

/**
 * 带坐标信息的通用接口
 */
export interface Locatable {
  id: string
  coordinates: Coordinates
}

/**
 * 路径计算结果
 */
export interface RouteResult<T extends Locatable> {
  /** 排序后的点位列表 */
  orderedPoints: T[]
  /** 每段距离(公里) */
  segmentDistances: number[]
  /** 总距离(公里) */
  totalDistance: number
}

/**
 * 最近邻居算法(贪心算法)进行路径排序
 * 从起点开始,每次选择距离当前点最近的未访问点
 *
 * 算法步骤:
 * 1. 将起点标记为已访问,加入路径
 * 2. 在未访问点中寻找距离当前点最近的点
 * 3. 将该点加入路径,标记为已访问
 * 4. 重复步骤2-3,直到所有点都被访问
 *
 * @param points 待排序的点位列表(必须包含坐标信息)
 * @param startPoint 可选的起始点(如未指定则使用第一个点)
 * @param returnToStart 是否返回起点(闭合路径)
 * @returns 路径计算结果,包含排序后的点位、各段距离和总距离
 */
export function nearestNeighborRoute<T extends Locatable>(
  points: T[],
  startPoint?: T,
  returnToStart: boolean = false
): RouteResult<T> {
  if (points.length === 0) {
    return {
      orderedPoints: [],
      segmentDistances: [],
      totalDistance: 0
    }
  }

  if (points.length === 1) {
    return {
      orderedPoints: [...points],
      segmentDistances: [],
      totalDistance: 0
    }
  }

  const unvisited = [...points]
  const orderedPoints: T[] = []
  const segmentDistances: number[] = []
  let totalDistance = 0

  const start = startPoint ?? unvisited[0]
  const startIndex = unvisited.findIndex(p => p.id === start.id)
  if (startIndex !== -1) {
    unvisited.splice(startIndex, 1)
  }
  orderedPoints.push(start)

  let currentPoint = start

  while (unvisited.length > 0) {
    let nearestIndex = 0
    let nearestDistance = Infinity

    for (let i = 0; i < unvisited.length; i++) {
      const distance = haversineDistance(currentPoint.coordinates, unvisited[i].coordinates)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = i
      }
    }

    const nearestPoint = unvisited.splice(nearestIndex, 1)[0]
    orderedPoints.push(nearestPoint)
    segmentDistances.push(nearestDistance)
    totalDistance += nearestDistance
    currentPoint = nearestPoint
  }

  if (returnToStart && orderedPoints.length > 1) {
    const returnDistance = haversineDistance(
      currentPoint.coordinates, start.coordinates
    )
    segmentDistances.push(returnDistance)
    totalDistance += returnDistance
    orderedPoints.push(start)
  }

  return {
    orderedPoints,
    segmentDistances,
    totalDistance
  }
}

/**
 * 优化的最近邻居算法(多次尝试不同起点,选择最优解)
 * 比基础最近邻居算法通常能得到更优的路径,但计算量稍大
 *
 * @param points 待排序的点位列表
 * @param returnToStart 是否返回起点
 * @returns 最优路径计算结果
 */
export function optimizedNearestNeighbor<T extends Locatable>(
  points: T[],
  returnToStart: boolean = false
): RouteResult<T> {
  if (points.length <= 2) {
    return nearestNeighborRoute(points, undefined, returnToStart)
  }

  let bestRoute: RouteResult<T> | null = null

  for (let i = 0; i < points.length; i++) {
    const route = nearestNeighborRoute(points, points[i], returnToStart)
    if (!bestRoute || route.totalDistance < bestRoute.totalDistance) {
      bestRoute = route
    }
  }

  return bestRoute!
}

/**
 * 估算步行时间
 * @param distanceKm 距离(单位:公里)
 * @param walkingSpeedKmh 步行速度(单位:公里/小时),默认5km/h
 * @param includeStops 是否包含停留时间(每20分钟休息5分钟)
 * @returns 步行时间(单位:分钟)
 */
export function estimateWalkTime(
  distanceKm: number,
  walkingSpeedKmh: number = WALKING_SPEED_KMH,
  includeStops: boolean = false
): number {
  if (distanceKm <= 0 || walkingSpeedKmh <= 0) {
    return 0
  }

  const walkingMinutes = (distanceKm / walkingSpeedKmh) * 60

  if (!includeStops) {
    return Math.ceil(walkingMinutes)
  }

  const stops = Math.floor(walkingMinutes / 20)
  const stopMinutes = stops * 5

  return Math.ceil(walkingMinutes + stopMinutes)
}

/**
 * 格式化步行时间为人类可读格式
 * @param minutes 步行时间(分钟)
 * @returns 格式化的时间字符串
 */
export function formatWalkTime(minutes: number): string {
  if (minutes <= 0) {
    return '-'
  }

  if (minutes < 60) {
    return `${Math.ceil(minutes)}分钟`
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = Math.ceil(minutes % 60)

  if (remainMinutes === 0) {
    return `${hours}小时`
  }

  return `${hours}小时${remainMinutes}分钟`
}

/**
 * 计算多点之间的总路径距离
 * @param points 按顺序排列的坐标点列表
 * @returns 总距离(公里)
 */
export function calculateTotalDistance(points: Coordinates[]): number {
  if (points.length < 2) {
    return 0
  }

  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistance(points[i], points[i + 1])
  }
  return total
}

/**
 * 查找距离目标点最近的点
 * @param target 目标点坐标
 * @param candidates 候选点列表
 * @param maxDistanceKm 最大搜索距离(公里),可选
 * @returns 最近的点及其距离,未找到返回null
 */
export function findNearest<T extends Locatable>(
  target: Coordinates,
  candidates: T[],
  maxDistanceKm?: number
): (T & { distance: number }) | null {
  if (candidates.length === 0) {
    return null
  }

  let nearest: (T & { distance: number }) | null = null

  for (const candidate of candidates) {
    const distance = haversineDistance(target, candidate.coordinates)

    if (maxDistanceKm !== undefined && distance > maxDistanceKm) {
      continue
    }

    if (!nearest || distance < nearest.distance) {
      nearest = { ...candidate, distance }
    }
  }

  return nearest
}

/**
 * 查找指定半径范围内的所有点
 * @param center 中心点坐标
 * @param candidates 候选点列表
 * @param radiusKm 搜索半径(公里)
 * @returns 范围内的点列表(按距离排序)
 */
export function findWithinRadius<T extends Locatable>(
  center: Coordinates,
  candidates: T[],
  radiusKm: number
): Array<T & { distance: number }> {
  const results: Array<T & { distance: number }> = []

  for (const candidate of candidates) {
    const distance = haversineDistance(center, candidate.coordinates)
    if (distance <= radiusKm) {
      results.push({ ...candidate, distance })
    }
  }

  results.sort((a, b) => a.distance - b.distance)
  return results
}

/**
 * 计算坐标点的中心点(平均坐标)
 * @param points 坐标点列表
 * @returns 中心点坐标
 */
export function calculateCenter(points: Coordinates[]): Coordinates | null {
  if (points.length === 0) {
    return null
  }

  let sumLat = 0
  let sumLon = 0

  for (const point of points) {
    sumLat += point.latitude
    sumLon += point.longitude
  }

  return {
    latitude: sumLat / points.length,
    longitude: sumLon / points.length
  }
}

/**
 * 判断点是否在多边形范围内(射线法)
 * @param point 待判断的点
 * @param polygon 多边形顶点坐标列表
 * @returns 是否在多边形内
 */
export function isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
  if (polygon.length < 3) {
    return false
  }

  let inside = false
  const n = polygon.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].latitude
    const yi = polygon[i].longitude
    const xj = polygon[j].latitude
    const yj = polygon[j].longitude

    const intersect =
      yi > point.longitude !== yj > point.longitude &&
      point.latitude < ((xj - xi) * (point.longitude - yi) / (yj - yi) + xi)

    if (intersect) {
      inside = !inside
    }
  }

  return inside
}

/**
 * 计算两点之间的中间点坐标
 * @param point1 第一个点
 * @param point2 第二个点
 * @param fraction 中间点位置比例(0-1),默认0.5为正中间
 * @returns 中间点坐标
 */
export function midpoint(
  point1: Coordinates,
  point2: Coordinates,
  fraction: number = 0.5
): Coordinates {
  const f = Math.max(0, Math.min(1, fraction))

  const lat1 = toRadians(point1.latitude)
  const lon1 = toRadians(point1.longitude)
  const lat2 = toRadians(point2.latitude)
  const lon2 = toRadians(point2.longitude)

  const dLon = lon2 - lon1

  const bx = Math.cos(lat2) * Math.cos(dLon)
  const by = Math.cos(lat2) * Math.sin(dLon)

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) ** 2 + by ** 2)
  )
  const lon3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx)

  const latFinal = lat1 + (lat3 - lat1) * f
  const lonFinal = lon1 + (lon3 - lon1) * f

  return {
    latitude: (latFinal * 180) / Math.PI,
    longitude: (lonFinal * 180) / Math.PI
  }
}
