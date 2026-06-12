import { openPublicArtDB, Volunteer, PublicArtDB } from '../index';

/**
 * 志愿者数据仓库类
 * 封装志愿者相关的所有数据库操作
 */
export class VolunteerRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 获取所有志愿者列表
   * @returns 志愿者数组
   */
  async getAll(): Promise<Volunteer[]> {
    const db = await this.getDB();
    return db.getAll('volunteers');
  }

  /**
   * 创建新的志愿者记录
   * @param volunteer 志愿者数据
   * @returns 新创建记录的ID
   */
  async create(volunteer: Omit<Volunteer, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('volunteers', volunteer);
  }

  /**
   * 更新志愿者的巡检统计数据
   * @param id 志愿者ID
   * @param incrementCount 新增巡检次数增量（默认为1）
   * @returns 更新后的记录ID
   */
  async updateStats(id: number, incrementCount: number = 1): Promise<number> {
    const db = await this.getDB();
    const existing = await db.get('volunteers', id);
    if (!existing) {
      throw new Error(`志愿者ID ${id} 不存在`);
    }
    const updated: Volunteer = {
      ...existing,
      inspectionCount: existing.inspectionCount + incrementCount,
    };
    return db.put('volunteers', updated);
  }

  /**
   * 获取巡检次数排名前N的志愿者
   * @param limit 返回的志愿者数量
   * @returns 按巡检次数倒序排列的志愿者数组
   */
  async getTop(limit: number = 10): Promise<Volunteer[]> {
    const db = await this.getDB();
    const volunteers = await db.getAll('volunteers');
    return volunteers
      .sort((a, b) => b.inspectionCount - a.inspectionCount)
      .slice(0, limit);
  }

  /**
   * 根据ID获取单个志愿者
   * @param id 志愿者ID
   * @returns 志愿者对象或undefined
   */
  async getById(id: number): Promise<Volunteer | undefined> {
    const db = await this.getDB();
    return db.get('volunteers', id);
  }

  /**
   * 根据姓名查询志愿者
   * @param name 志愿者姓名
   * @returns 姓名匹配的志愿者数组
   */
  async getByName(name: string): Promise<Volunteer[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('volunteers', 'name', IDBKeyRange.only(name));
  }

  /**
   * 更新志愿者信息
   * @param id 志愿者ID
   * @param volunteer 更新的志愿者数据
   * @returns 更新后的记录ID
   */
  async update(id: number, volunteer: Partial<Volunteer>): Promise<number> {
    const db = await this.getDB();
    const existing = await db.get('volunteers', id);
    if (!existing) {
      throw new Error(`志愿者ID ${id} 不存在`);
    }
    const updated: Volunteer = {
      ...existing,
      ...volunteer,
      id,
    };
    return db.put('volunteers', updated);
  }

  /**
   * 删除志愿者记录
   * @param id 志愿者ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('volunteers', id);
  }
}
