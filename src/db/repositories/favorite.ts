import { openPublicArtDB, Favorite, PublicArtDB } from '../index';

export class FavoriteRepository {
  private async getDB(): Promise<PublicArtDB> {
    return openPublicArtDB();
  }

  async getAll(): Promise<Favorite[]> {
    const db = await this.getDB();
    return db.getAll('favorites');
  }

  async getByUserId(userId: string): Promise<Favorite[]> {
    const db = await this.getDB();
    const results = await db.getAllFromIndex('favorites', 'userId', IDBKeyRange.only(userId));
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getByArtworkId(artworkId: number): Promise<Favorite[]> {
    const db = await this.getDB();
    return db.getAllFromIndex('favorites', 'artworkId', IDBKeyRange.only(artworkId));
  }

  async isFavorited(artworkId: number, userId: string): Promise<boolean> {
    const db = await this.getDB();
    const all = await db.getAll('favorites');
    return all.some(f => f.artworkId === artworkId && f.userId === userId);
  }

  async create(favorite: Omit<Favorite, 'id'>): Promise<number> {
    const db = await this.getDB();
    const existing = await db.getAll('favorites');
    const found = existing.find(f => f.artworkId === favorite.artworkId && f.userId === favorite.userId);
    if (found) return found.id!;
    return db.add('favorites', favorite);
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDB();
    return db.delete('favorites', id);
  }

  async removeByArtworkAndUser(artworkId: number, userId: string): Promise<void> {
    const db = await this.getDB();
    const all = await db.getAll('favorites');
    const found = all.find(f => f.artworkId === artworkId && f.userId === userId);
    if (found && found.id) {
      await db.delete('favorites', found.id);
    }
  }

  async toggle(artworkId: number, userId: string): Promise<{ favorited: boolean; id?: number }> {
    const favorited = await this.isFavorited(artworkId, userId);
    if (favorited) {
      await this.removeByArtworkAndUser(artworkId, userId);
      return { favorited: false };
    } else {
      const id = await this.create({
        artworkId,
        userId,
        createdAt: new Date().toISOString(),
      });
      return { favorited: true, id };
    }
  }
}
