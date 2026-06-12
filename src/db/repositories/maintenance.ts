import { openPublicArtDB, Maintenance, PublicArtDB } from '../index';

/**
 * 维护记录数据仓库类
 * 封装维护记录相关的所有数据库操作
 */
export class MaintenanceRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 根据艺术品ID获取所有维护记录
   * @param artworkId 艺术品ID
   * @returns 维护记录数组，按日期倒序排列
   */
  async getByArtworkId(artworkId: number): Promise<Maintenance[]> {
    const db = await this.getDB();
    const results = await db.getAllFromIndex('maintenances', 'artworkId', IDBKeyRange.only(artworkId));
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 创建新的维护记录
   * @param maintenance 维护记录数据
   * @returns 新创建记录的ID
   */
  async create(maintenance: Omit<Maintenance, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('maintenances', maintenance);
  }

  /**
   * 获取指定艺术品的维护总费用
   * @param artworkId 艺术品ID
   * @returns 总费用金额
   */
  async getTotalCostByArtworkId(artworkId: number): Promise<number> {
    const db = await this.getDB();
    const records = await db.getAllFromIndex('maintenances', 'artworkId', IDBKeyRange.only(artworkId));
    return records.reduce((total, record) => total + (record.cost || 0), 0);
  }

  /**
   * 获取所有维护记录
   * @returns 维护记录数组
   */
  async getAll(): Promise<Maintenance[]> {
    const db = await this.getDB();
    return db.getAll('maintenances');
  }

  /**
   * 根据ID获取单条维护记录
   * @param id 维护记录ID
   * @returns 维护记录对象或undefined
   */
  async getById(id: number): Promise<Maintenance | undefined> {
    const db = await this.getDB();
    return db.get('maintenances', id);
  }

  /**
   * 根据承建商名称查询维护记录
   * @param contractor 承建商名称
   * @returns 该承建商的维护记录数组
   */
  async getByContractor(contractor: string): Promise<Maintenance[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('maintenances', 'contractor', IDBKeyRange.only(contractor));
  }

  /**
   * 根据日期范围查询维护记录
   * @param startDate 开始日期（含）
   * @param endDate 结束日期（含）
   * @returns 该日期范围内的维护记录数组
   */
  async getByDateRange(startDate: string, endDate: string): Promise<Maintenance[]> {
    const db = await this.getDB();
    const range = IDBKeyRange.bound(startDate, endDate, false, false);
    return db.getAllFromIndex('maintenances', 'date', range);
  }

  /**
   * 删除维护记录
   * @param id 维护记录ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('maintenances', id);
  }
}
