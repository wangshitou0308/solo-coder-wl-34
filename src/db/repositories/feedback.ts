import { openPublicArtDB, Feedback, PublicArtDB } from '../index';

export class FeedbackRepository {
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  async getAll(): Promise<Feedback[]> {
    const db = await this.getDB();
    return db.getAll('feedbacks');
  }

  async getById(id: number): Promise<Feedback | undefined> {
    const db = await this.getDB();
    return db.get('feedbacks', id);
  }

  async getByArtworkId(artworkId: number): Promise<Feedback[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('feedbacks', 'artworkId', IDBKeyRange.only(artworkId));
  }

  async getByStatus(status: string): Promise<Feedback[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('feedbacks', 'status', IDBKeyRange.only(status));
  }

  async create(feedback: Omit<Feedback, 'id'>): Promise<number> {
    const db = await this.getDB();
    return db.add('feedbacks', feedback);
  }

  async update(id: number, data: Partial<Feedback>): Promise<number> {
    const db = await this.getDB();
    const existing = await db.get('feedbacks', id);
    if (!existing) throw new Error(`反馈ID ${id} 不存在`);
    const updated: Feedback = { ...existing, ...data, id };
    return db.put('feedbacks', updated);
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('feedbacks', id);
  }

  async process(id: number, handler: string): Promise<number> {
    return this.update(id, {
      status: 'processing',
      handler,
    });
  }

  async resolve(id: number, handler: string, handleNote: string): Promise<number> {
    return this.update(id, {
      status: 'resolved',
      handler,
      handleNote,
      handledAt: new Date().toISOString(),
    });
  }

  async reject(id: number, handler: string, handleNote: string): Promise<number> {
    return this.update(id, {
      status: 'rejected',
      handler,
      handleNote,
      handledAt: new Date().toISOString(),
    });
  }
}
