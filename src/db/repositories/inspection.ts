import { openPublicArtDB, Inspection, PublicArtDB } from '../index';

/**
 * 巡检记录数据仓库类
 * 封装巡检记录相关的所有数据库操作
 */
export class InspectionRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 根据艺术品ID获取所有巡检记录
   * @param artworkId 艺术品ID
   * @returns 巡检记录数组，按日期倒序排列
   */
  async getByArtworkId(artworkId: number): Promise<Inspection[]> {
    const db = await this.getDB();
    const results = await db.getAllFromIndex('inspections', 'artworkId', IDBKeyRange.only(artworkId));
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 创建新的巡检记录
   * @param inspection 巡检记录数据
   * @returns 新创建记录的ID
   */
  async create(inspection: Omit<Inspection, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('inspections', inspection);
  }

  /**
   * 根据日期范围查询巡检记录
   * @param startDate 开始日期（含）
   * @param endDate 结束日期（含）
   * @returns 该日期范围内的巡检记录数组
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Inspection[]> {
    const db = await this.getDB();
    const range = IDBKeyRange.bound(startDate, endDate, false, false);
    return db.getAllFromIndex('inspections', 'date', range);
  }

  /**
   * 根据志愿者姓名查询巡检记录
   * @param volunteer 志愿者姓名
   * @returns 该志愿者的巡检记录数组
   */
  async getByVolunteer(volunteer: string): Promise<Inspection[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('inspections', 'volunteer', IDBKeyRange.only(volunteer));
  }

  /**
   * 获取所有巡检记录
   * @returns 巡检记录数组
   */
  async getAll(): Promise<Inspection[]> {
    const db = await this.getDB();
    return db.getAll('inspections');
  }

  /**
   * 根据ID获取单条巡检记录
   * @param id 巡检记录ID
   * @returns 巡检记录对象或undefined
   */
  async getById(id: number): Promise<Inspection | undefined> {
    const db = await this.getDB();
    return db.get('inspections', id);
  }

  /**
   * 删除巡检记录
   * @param id 巡检记录ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('inspections', id);
  }
}
