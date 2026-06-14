import { openPublicArtDB, Submission, PublicArtDB } from '../index';

export class SubmissionRepository {
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  async getAll(): Promise<Submission[]> {
    const db = await this.getDB();
    return db.getAll('submissions');
  }

  async getById(id: number): Promise<Submission | undefined> {
    const db = await this.getDB();
    return db.get('submissions', id);
  }

  async getByStatus(status: string): Promise<Submission[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('submissions', 'status', IDBKeyRange.only(status));
  }

  async create(submission: Omit<Submission, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('submissions', submission);
  }

  async update(id: number, data: Partial<Submission>): Promise<number> {
    const db = await this.getDB();
    const existing = await db.get('submissions', id);
    if (!existing) throw new Error(`投稿ID ${id} 不存在`);
    const updated: Submission = { ...existing, ...data, id };
    return db.put('submissions', updated);
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('submissions', id);
  }

  async approve(id: number, artworkId: number, reviewer: string, reviewNote?: string): Promise<number> {
    return this.update(id, {
      status: 'approved',
      artworkId,
      reviewer,
      reviewNote,
      reviewedAt: new Date().toISOString(),
    });
  }

  async reject(id: number, reviewer: string, reviewNote: string): Promise<number> {
    return this.update(id, {
      status: 'rejected',
      reviewer,
      reviewNote,
      reviewedAt: new Date().toISOString(),
    });
  }
}
