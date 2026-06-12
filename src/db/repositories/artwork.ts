import { openPublicArtDB, Artwork, PublicArtDB } from '../index';

/**
 * 艺术品过滤条件接口定义
 */
export interface ArtworkFilter {
  type?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  material?: string;
  district?: string;
  statusLatest?: string;
  name?: string;
  artist?: string;
}

/**
 * 艺术品数据仓库类
 * 封装艺术品相关的所有数据库操作
 */
export class ArtworkRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 获取所有艺术品列表
   * @returns 艺术品数组Promise
   */
  async getAll(): Promise<Artwork[]> {
    const db = await this.getDB();
    return db.getAll('artworks');
  }

  /**
   * 根据ID获取单个艺术品
   * @param id 艺术品ID
   * @returns 艺术品对象或undefined
   */
  async getById(id: number): Promise<Artwork | undefined> {
    const db = await this.getDB();
    return db.get('artworks', id);
  }

  /**
   * 创建新的艺术品记录
   * @param artwork 艺术品数据
   * @returns 新创建记录的ID
   */
  async create(artwork: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'inspectionCount'>): Promise<number> {
    const db = await this.getDB();
    const now = new Date().toISOString();
    const data: Artwork = {
      ...artwork,
      viewCount: 0,
      inspectionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    return db.add('artworks', data);
  }

  /**
   * 增加艺术品浏览量
   * @param id 艺术品ID
   */
  async incrementViewCount(id: number): Promise<void> {
    const db = await this.getDB();
    const existing = await db.get('artworks', id);
    if (existing) {
      const updated: Artwork = {
        ...existing,
        viewCount: existing.viewCount + 1,
      };
      await db.put('artworks', updated);
    }
  }

  /**
   * 增加巡查次数
   * @param id 艺术品ID
   */
  async incrementInspectionCount(id: number): Promise<void> {
    const db = await this.getDB();
    const existing = await db.get('artworks', id);
    if (existing) {
      const updated: Artwork = {
        ...existing,
        inspectionCount: existing.inspectionCount + 1,
      };
      await db.put('artworks', updated);
    }
  }

  /**
   * 获取浏览量/评分排名前N的作品
   * @param limit 返回数量
   * @param sortBy 排序字段
   */
  async getTopArtworks(limit: number = 10, sortBy: 'viewCount' | 'inspectionCount' | 'year' = 'viewCount'): Promise<Artwork[]> {
    const db = await this.getDB();
    const all = await db.getAll('artworks');
    return all.sort((a, b) => {
      if (sortBy === 'year') return b.year - a.year;
      return (b[sortBy] || 0) - (a[sortBy] || 0);
    }).slice(0, limit);
  }

  /**
   * 更新艺术品记录
   * @param id 艺术品ID
   * @param artwork 更新的艺术品数据
   * @returns 更新后的记录ID
   */
  async update(id: number, artwork: Partial<Artwork>): Promise<number> {
    const db = await this.getDB();
    const existing = await db.get('artworks', id);
    if (!existing) {
      throw new Error(`艺术品ID ${id} 不存在`);
    }
    const updated: Artwork = {
      ...existing,
      ...artwork,
      id,
      updatedAt: new Date().toISOString(),
    };
    return db.put('artworks', updated);
  }

  /**
   * 删除艺术品记录
   * @param id 艺术品ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('artworks', id);
  }

  /**
   * 根据过滤条件查询艺术品
   * @param filter 过滤条件对象
   * @returns 符合条件的艺术品数组
   */
  async filter(filter: ArtworkFilter): Promise<Artwork[]> {
    const db = await this.getDB();
    let results: Artwork[] = await db.getAll('artworks');

    if (filter.type) {
      results = results.filter((item) => item.type === filter.type);
    }
    if (filter.year !== undefined) {
      results = results.filter((item) => item.year === filter.year);
    }
    if (filter.yearFrom !== undefined) {
      results = results.filter((item) => item.year >= filter.yearFrom!);
    }
    if (filter.yearTo !== undefined) {
      results = results.filter((item) => item.year <= filter.yearTo!);
    }
    if (filter.material) {
      results = results.filter((item) => item.material === filter.material);
    }
    if (filter.district) {
      results = results.filter((item) => item.district === filter.district);
    }
    if (filter.statusLatest) {
      results = results.filter((item) => item.statusLatest === filter.statusLatest);
    }
    if (filter.name) {
      const keyword = filter.name.toLowerCase();
      results = results.filter((item) => item.name.toLowerCase().includes(keyword));
    }
    if (filter.artist) {
      const keyword = filter.artist.toLowerCase();
      results = results.filter((item) => item.artist.toLowerCase().includes(keyword));
    }

    return results;
  }

  /**
   * 根据行政区域查询艺术品
   * @param district 行政区域名称
   * @returns 该区域的艺术品数组
   */
  async queryByDistrict(district: string): Promise<Artwork[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('artworks', 'district', IDBKeyRange.only(district));
  }

  /**
   * 获取指定艺术品的最新状态
   * @param artworkId 艺术品ID
   * @returns 最新状态字符串，若不存在则返回'未知'
   */
  async getLatestStatus(artworkId: number): Promise<string> {
    const db = await this.getDB();
    const artwork = await db.get('artworks', artworkId);
    return artwork?.statusLatest ?? '未知';
  }
}
