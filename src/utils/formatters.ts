/**
 * 格式化工具函数
 * 提供日期、货币、百分比、距离等常用格式化方法
 */

/**
 * 格式化日期为中文格式
 * @param date 日期字符串、Date对象或时间戳
 * @param format 格式化模式，默认'YYYY-MM-DD'
 * @returns 格式化后的日期字符串
 *
 * 支持的格式占位符:
 * - YYYY: 4位年份
 * - MM: 2位月份
 * - DD: 2位日期
 * - HH: 2位小时(24小时制)
 * - mm: 2位分钟
 * - ss: 2位秒
 */
export function formatDate(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD'
): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    return '-'
  }

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取相对时间描述(如"3天前"、"刚刚")
 * @param date 日期字符串、Date对象或时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: string | number | Date): string {
  const d = new Date(date)
  const now = new Date()

  if (isNaN(d.getTime())) {
    return '-'
  }

  const diffMs = now.getTime() - d.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSeconds < 60) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  if (diffWeeks < 5) return `${diffWeeks}周前`
  if (diffMonths < 12) return `${diffMonths}个月前`
  return `${diffYears}年前`
}

/**
 * 格式化人民币金额
 * @param amount 金额数值(单位:元)
 * @param showSymbol 是否显示¥符号，默认true
 * @param decimals 小数位数，默认2
 * @returns 格式化后的金额字符串
 */
export function formatCurrency(
  amount: number,
  showSymbol: boolean = true,
  decimals: number = 2
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '-'
  }

  const symbol = showSymbol ? '¥' : ''
  const formatted = Math.abs(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  const sign = amount < 0 ? '-' : ''
  return `${sign}${symbol}${formatted}`
}

/**
 * 格式化大额金额为简洁形式(如 1.2万、3.5亿)
 * @param amount 金额数值(单位:元)
 * @returns 格式化后的简洁金额字符串
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '-'
  }

  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (absAmount >= 100000000) {
    return `${sign}¥${(absAmount / 100000000).toFixed(2)}亿`
  }
  if (absAmount >= 10000) {
    return `${sign}¥${(absAmount / 10000).toFixed(2)}万`
  }
  return formatCurrency(amount)
}

/**
 * 格式化百分比
 * @param value 百分比数值(如0.85表示85%)
 * @param decimals 小数位数，默认1
 * @param multiply 是否需要乘以100，默认true
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(
  value: number,
  decimals: number = 1,
  multiply: boolean = true
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-'
  }

  const num = multiply ? value * 100 : value
  return `${num.toFixed(decimals)}%`
}

/**
 * 格式化距离
 * @param meters 距离数值(单位:米)
 * @returns 格式化后的距离字符串(自动选择米或公里)
 */
export function formatDistance(meters: number): string {
  if (meters === null || meters === undefined || isNaN(meters) || meters < 0) {
    return '-'
  }

  if (meters < 1000) {
    const rounded = Math.round(meters)
    return `${rounded}米`
  }

  const kilometers = meters / 1000
  return `${kilometers.toFixed(kilometers < 10 ? 2 : 1)}公里`
}

/**
 * 格式化面积
 * @param squareMeters 面积数值(单位:平方米)
 * @returns 格式化后的面积字符串
 */
export function formatArea(squareMeters: number): string {
  if (squareMeters === null || squareMeters === undefined || isNaN(squareMeters)) {
    return '-'
  }

  if (squareMeters < 10000) {
    return `${squareMeters.toFixed(1)}平方米`
  }

  return `${(squareMeters / 10000).toFixed(2)}公顷`
}

/**
 * 格式化时长(秒转为人类可读格式)
 * @param seconds 秒数
 * @returns 格式化后的时长字符串
 */
export function formatDuration(seconds: number): string {
  if (seconds === null || seconds === undefined || isNaN(seconds) || seconds < 0) {
    return '-'
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}秒`
  }

  const minutes = Math.floor(seconds / 60)
  const remainSeconds = Math.round(seconds % 60)

  if (minutes < 60) {
    return remainSeconds > 0 ? `${minutes}分${remainSeconds}秒` : `${minutes}分钟`
  }

  const hours = Math.floor(minutes / 60)
  const remainMinutes = minutes % 60

  if (hours < 24) {
    return remainMinutes > 0 ? `${hours}小时${remainMinutes}分` : `${hours}小时`
  }

  const days = Math.floor(hours / 24)
  const remainHours = hours % 24

  return remainHours > 0 ? `${days}天${remainHours}小时` : `${days}天`
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === null || bytes === undefined || isNaN(bytes) || bytes < 0) {
    return '-'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 2)}${units[unitIndex]}`
}

/**
 * 格式化数字为千分位格式
 * @param num 数字
 * @param decimals 小数位数，默认0
 * @returns 格式化后的数字字符串
 */
export function formatNumber(num: number, decimals: number = 0): string {
  if (num === null || num === undefined || isNaN(num)) {
    return '-'
  }

  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * 格式化电话号码(添加分隔符)
 * @param phone 电话号码字符串
 * @returns 格式化后的电话号码
 */
export function formatPhone(phone: string): string {
  if (!phone) return '-'

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }

  return cleaned || '-'
}

/**
 * 格式化身份证号(脱敏显示)
 * @param idCard 身份证号
 * @returns 脱敏后的身份证号
 */
export function formatIdCard(idCard: string): string {
  if (!idCard) return '-'

  if (idCard.length === 18) {
    return `${idCard.slice(0, 6)}********${idCard.slice(14)}`
  }

  if (idCard.length === 15) {
    return `${idCard.slice(0, 6)}*******${idCard.slice(13)}`
  }

  return idCard
}

/**
 * 获取星期几的中文名称
 * @param date 日期字符串、Date对象或时间戳
 * @returns 星期几的中文名称
 */
export function formatWeekday(date: string | number | Date): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    return '-'
  }

  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekdays[d.getDay()]
}

/**
 * 格式化日期为完整中文格式(如:2024年1月15日 星期一)
 * @param date 日期字符串、Date对象或时间戳
 * @returns 完整中文日期格式
 */
export function formatDateFull(date: string | number | Date): string {
  const d = new Date(date)

  if (isNaN(d.getTime())) {
    return '-'
  }

  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${formatWeekday(date)}`
}
