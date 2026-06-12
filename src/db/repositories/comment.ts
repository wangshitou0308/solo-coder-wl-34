import { openPublicArtDB, Comment, PublicArtDB } from '../index';

/**
 * 评论数据仓库类
 * 封装评论相关的所有数据库操作
 */
export class CommentRepository {
  /**
   * 获取数据库实例
   * @returns 数据库实例Promise
   */
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  /**
   * 根据艺术品ID获取所有评论
   * @param artworkId 艺术品ID
   * @returns 评论数组，按日期倒序排列
   */
  async getByArtworkId(artworkId: number): Promise<Comment[]> {
    const db = await this.getDB();
    const results = await db.getAllFromIndex('comments', 'artworkId', IDBKeyRange.only(artworkId));
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * 创建新的评论
   * @param comment 评论数据
   * @returns 新创建记录的ID
   */
  async create(comment: Omit<Comment, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('comments', comment);
  }

  /**
   * 获取指定艺术品的平均评分
   * @param artworkId 艺术品ID
   * @returns 平均评分（四舍五入保留1位小数），无评论时返回0
   */
  async getAverageRating(artworkId: number): Promise<number> {
    const db = await this.getDB();
    const comments = await db.getAllFromIndex('comments', 'artworkId', IDBKeyRange.only(artworkId));
    if (comments.length === 0) {
      return 0;
    }
    const total = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
    return Math.round((total / comments.length) * 10) / 10;
  }

  /**
   * 获取所有评论
   * @returns 评论数组
   */
  async getAll(): Promise<Comment[]> {
    const db = await this.getDB();
    return db.getAll('comments');
  }

  /**
   * 根据ID获取单条评论
   * @param id 评论ID
   * @returns 评论对象或undefined
   */
  async getById(id: number): Promise<Comment | undefined> {
    const db = await this.getDB();
    return db.get('comments', id);
  }

  /**
   * 根据评分等级查询评论
   * @param rating 评分等级（1-5）
   * @returns 该评分等级的评论数组
   */
  async getByRating(rating: number): Promise<Comment[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('comments', 'rating', IDBKeyRange.only(rating));
  }

  /**
   * 删除评论
   * @param id 评论ID
   */
  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('comments', id);
  }
}
