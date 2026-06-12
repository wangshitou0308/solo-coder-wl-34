import { openPublicArtDB, Photo, UserPhoto, PublicArtDB } from '../index';

/**
 * 官方照片数据仓库类
 * 封装官方照片相关的所有数据库操作
 */
export class PhotoRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 根据艺术品ID获取所有官方照片
   * @param artworkId 艺术品ID
   * @returns 官方照片数组
   */
  async getByArtworkId(artworkId: number): Promise<Photo[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('photos', 'artworkId', IDBKeyRange.only(artworkId));
  }

  /**
   * 创建新的官方照片记录
   * @param photo 照片数据
   * @returns 新创建记录的ID
   */
  async create(photo: Omit<Photo, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('photos', photo);
  }

  /**
   * 删除官方照片记录
   * @param id 照片ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('photos', id);
  }

  /**
   * 根据分类获取官方照片
   * @param category 分类名称
   * @returns 该分类的照片数组
   */
  async getByCategory(category: string): Promise<Photo[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('photos', 'category', IDBKeyRange.only(category));
  }

  /**
   * 获取所有官方照片
   * @returns 照片数组
   */
  async getAll(): Promise<Photo[]> {
    const db = await this.getDB();
    return db.getAll('photos');
  }

  /**
   * 根据ID获取单条官方照片
   * @param id 照片ID
   * @returns 照片对象或undefined
   */
  async getById(id: number): Promise<Photo | undefined> {
    const db = await this.getDB();
    return db.get('photos', id);
  }
}

/**
 * 用户上传照片数据仓库类
 * 封装用户上传照片相关的所有数据库操作
 */
export class UserPhotoRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 根据艺术品ID获取所有用户上传照片
   * @param artworkId 艺术品ID
   * @returns 用户上传照片数组，按日期倒序排列
   */
  async getByArtworkId(artworkId: number): Promise<UserPhoto[]> {
    const db = await this.getDB();
    const results = await db.getAllFromIndex('userPhotos', 'artworkId', IDBKeyRange.only(artworkId));
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 创建新的用户上传照片记录
   * @param userPhoto 用户照片数据
   * @returns 新创建记录的ID
   */
  async create(userPhoto: Omit<UserPhoto, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('userPhotos', userPhoto);
  }

  /**
   * 删除用户上传照片记录
   * @param id 照片ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('userPhotos', id);
  }

  /**
   * 获取所有用户上传照片
   * @returns 照片数组
   */
  async getAll(): Promise<UserPhoto[]> {
    const db = await this.getDB();
    return db.getAll('userPhotos');
  }

  /**
   * 根据ID获取单条用户上传照片
   * @param id 照片ID
   * @returns 照片对象或undefined
   */
  async getById(id: number): Promise<UserPhoto | undefined> {
    const db = await this.getDB();
    return db.get('userPhotos', id);
  }

  /**
   * 根据日期范围查询用户上传照片
   * @param startDate 开始日期（含）
   * @param endDate 结束日期（含）
   * @returns 该日期范围内的照片数组
   */
  async getByDateRange(startDate: string, endDate: string): Promise<UserPhoto[]> {
    const db = await this.getDB();
    const range = IDBKeyRange.bound(startDate, endDate, false, false);
    return db.getAllFromIndex('userPhotos', 'date', range);
  }
}
