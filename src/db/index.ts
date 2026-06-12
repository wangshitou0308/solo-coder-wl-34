import { openDB, IDBPDatabase, DBSchema } from 'idb';

/**
 * 数据库名称常量
 */
export const DB_NAME = 'publicArtDB';

/**
 * 数据库版本号常量
 */
export const DB_VERSION = 2;

/**
 * 艺术品数据类型定义
 */
export interface Artwork {
  id?: number;
  name: string;
  type: string;
  year: number;
  material: string;
  district: string;
  address: string;
  artist: string;
  description: string;
  statusLatest: string;
  lat: number;
  lng: number;
  ownership?: string;
  fundingSource?: string;
  story?: string;
  publicFeedback?: string;
  viewCount: number;
  inspectionCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 巡检记录数据类型定义
 */
export interface Inspection {
  id?: number;
  artworkId: number;
  date: string;
  status: string;
  volunteer: string;
  issues: string;
  notes: string;
  photos: string[];
}

/**
 * 维护记录数据类型定义
 */
export interface Maintenance {
  id?: number;
  artworkId: number;
  date: string;
  contractor: string;
  workType: string;
  cost: number;
  description: string;
  completed: boolean;
  beforePhotos?: string[];
  afterPhotos?: string[];
}

/**
 * 评论数据类型定义
 */
export interface Comment {
  id?: number;
  artworkId: number;
  date: string;
  author: string;
  rating: number;
  content: string;
  photos: string[];
}

/**
 * 官方照片数据类型定义
 */
export interface Photo {
  id?: number;
  artworkId: number;
  category: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

/**
 * 用户上传照片数据类型定义
 */
export interface UserPhoto {
  id?: number;
  artworkId: number;
  date: string;
  url: string;
  author: string;
  description: string;
}

/**
 * 志愿者数据类型定义
 */
export interface Volunteer {
  id?: number;
  name: string;
  inspectionCount: number;
  phone: string;
  email: string;
  joinDate: string;
}

/**
 * 设置项数据类型定义
 */
export interface Setting {
  key: string;
  value: unknown;
}

/**
 * 数据库Schema定义，用于类型安全
 */
export interface PublicArtDBSchema extends DBSchema {
  artworks: {
    key: number;
    value: Artwork;
    indexes: {
      type: string;
      year: number;
      material: string;
      district: string;
      statusLatest: string;
    };
  };
  inspections: {
    key: number;
    value: Inspection;
    indexes: {
      artworkId: number;
      date: string;
      status: string;
      volunteer: string;
    };
  };
  maintenances: {
    key: number;
    value: Maintenance;
    indexes: {
      artworkId: number;
      date: string;
      contractor: string;
    };
  };
  comments: {
    key: number;
    value: Comment;
    indexes: {
      artworkId: number;
      date: string;
      rating: number;
    };
  };
  photos: {
    key: number;
    value: Photo;
    indexes: {
      artworkId: number;
      category: string;
    };
  };
  userPhotos: {
    key: number;
    value: UserPhoto;
    indexes: {
      artworkId: number;
      date: string;
    };
  };
  volunteers: {
    key: number;
    value: Volunteer;
    indexes: {
      name: string;
      inspectionCount: number;
    };
  };
  settings: {
    key: string;
    value: Setting;
    indexes: Record<string, never>;
  };
}

/**
 * 数据库连接类型别名
 */
export type PublicArtDB = IDBPDatabase<PublicArtDBSchema>;

/**
 * 打开并返回数据库实例的Promise缓存
 */
let dbPromise: Promise<PublicArtDB> | null = null;

/**
 * 打开或创建IndexedDB数据库
 * @returns 返回数据库实例Promise
 */
export function openPublicArtDB(): Promise<PublicArtDB> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = openDB<PublicArtDBSchema>(DB_NAME, DB_VERSION, {
    /**
     * 数据库升级回调函数
     * @param db 数据库实例
     * @param oldVersion 旧版本号
     * @param newVersion 新版本号
     */
    upgrade(db) {
      // 创建艺术品存储
      if (!db.objectStoreNames.contains('artworks')) {
        const artworksStore = db.createObjectStore('artworks', {
          keyPath: 'id',
          autoIncrement: true,
        });
        artworksStore.createIndex('type', 'type', { unique: false });
        artworksStore.createIndex('year', 'year', { unique: false });
        artworksStore.createIndex('material', 'material', { unique: false });
        artworksStore.createIndex('district', 'district', { unique: false });
        artworksStore.createIndex('statusLatest', 'statusLatest', { unique: false });
      }

      // 创建巡检记录存储
      if (!db.objectStoreNames.contains('inspections')) {
        const inspectionsStore = db.createObjectStore('inspections', {
          keyPath: 'id',
          autoIncrement: true,
        });
        inspectionsStore.createIndex('artworkId', 'artworkId', { unique: false });
        inspectionsStore.createIndex('date', 'date', { unique: false });
        inspectionsStore.createIndex('status', 'status', { unique: false });
        inspectionsStore.createIndex('volunteer', 'volunteer', { unique: false });
      }

      // 创建维护记录存储
      if (!db.objectStoreNames.contains('maintenances')) {
        const maintenancesStore = db.createObjectStore('maintenances', {
          keyPath: 'id',
          autoIncrement: true,
        });
        maintenancesStore.createIndex('artworkId', 'artworkId', { unique: false });
        maintenancesStore.createIndex('date', 'date', { unique: false });
        maintenancesStore.createIndex('contractor', 'contractor', { unique: false });
      }

      // 创建评论存储
      if (!db.objectStoreNames.contains('comments')) {
        const commentsStore = db.createObjectStore('comments', {
          keyPath: 'id',
          autoIncrement: true,
        });
        commentsStore.createIndex('artworkId', 'artworkId', { unique: false });
        commentsStore.createIndex('date', 'date', { unique: false });
        commentsStore.createIndex('rating', 'rating', { unique: false });
      }

      // 创建官方照片存储
      if (!db.objectStoreNames.contains('photos')) {
        const photosStore = db.createObjectStore('photos', {
          keyPath: 'id',
          autoIncrement: true,
        });
        photosStore.createIndex('artworkId', 'artworkId', { unique: false });
        photosStore.createIndex('category', 'category', { unique: false });
      }

      // 创建用户上传照片存储
      if (!db.objectStoreNames.contains('userPhotos')) {
        const userPhotosStore = db.createObjectStore('userPhotos', {
          keyPath: 'id',
          autoIncrement: true,
        });
        userPhotosStore.createIndex('artworkId', 'artworkId', { unique: false });
        userPhotosStore.createIndex('date', 'date', { unique: false });
      }

      // 创建志愿者存储
      if (!db.objectStoreNames.contains('volunteers')) {
        const volunteersStore = db.createObjectStore('volunteers', {
          keyPath: 'id',
          autoIncrement: true,
        });
        volunteersStore.createIndex('name', 'name', { unique: false });
        volunteersStore.createIndex('inspectionCount', 'inspectionCount', { unique: false });
      }

      // 创建设置存储
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', {
          keyPath: 'key',
          autoIncrement: false,
        });
      }
    },
  });

  return dbPromise;
}

/**
 * 关闭数据库连接
 */
export async function closePublicArtDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}
