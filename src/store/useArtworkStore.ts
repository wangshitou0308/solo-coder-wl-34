import { create } from 'zustand';
import { Artwork, Inspection, Maintenance, Comment, Photo, UserPhoto, Volunteer } from '../db';
import { artworkRepo, inspectionRepo, maintenanceRepo, commentRepo, photoRepo, userPhotoRepo, volunteerRepo } from '../../db';
import { initSeedData } from '@/utils/seedData';
import { InspectionStatus } from '@/types';

export interface ArtworkDetail {
  artwork: Artwork;
  inspections: Inspection[];
  maintenances: Maintenance[];
  comments: Comment[];
  photos: Photo[];
  userPhotos: UserPhoto[];
  avgRating: number;
  totalCost: number;
}

export interface DashboardStats {
  totalArtworks: number;
  typeDistribution: Record<string, number>;
  materialDistribution: Record<string, number>;
  districtDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  pendingMaintenance: Artwork[];
  monthlyCoverage: number;
  topVolunteers: Volunteer[];
  topArtworks: Artwork[];
}

export interface ArtworkState {
  artworks: Artwork[];
  loading: boolean;
  selected: ArtworkDetail | null;
  selectedId: number | null;
  initialized: boolean;
  seedMessage: string | null;
  volunteers: Volunteer[];
  inspections: Inspection[];
  maintenances: Maintenance[];
  comments: Comment[];
  error: string | null;
}

export interface ArtworkActions {
  initialize: () => Promise<void>;
  loadArtworks: () => Promise<void>;
  loadVolunteers: () => Promise<void>;
  loadInspections: () => Promise<void>;
  loadMaintenances: () => Promise<void>;
  loadComments: () => Promise<void>;
  loadDetail: (id: number) => Promise<void>;
  clearDetail: () => void;
  addInspection: (data: Omit<Inspection, 'id'>) => Promise<void>;
  addMaintenance: (data: Omit<Maintenance, 'id'>) => Promise<void>;
  addComment: (data: Omit<Comment, 'id'>) => Promise<void>;
  addUserPhoto: (data: Omit<UserPhoto, 'id'>) => Promise<void>;
  createArtwork: (data: Omit<Artwork, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'inspectionCount'>) => Promise<number>;
  updateArtwork: (id: number, data: Partial<Artwork>) => Promise<void>;
  deleteArtwork: (id: number) => Promise<void>;
  incrementViewCount: (id: number) => Promise<void>;
  getDashboardStats: () => Promise<DashboardStats>;
  getArtworksByDistrict: (district: string) => Artwork[];
  getLongUninspectedArtworks: (days?: number) => Artwork[];
}

const initialState: ArtworkState = {
  artworks: [],
  loading: false,
  selected: null,
  selectedId: null,
  initialized: false,
  seedMessage: null,
  volunteers: [],
  inspections: [],
  maintenances: [],
  comments: [],
  error: null,
};

export const useArtworkStore = create<ArtworkState & ArtworkActions>((set, get) => ({
  ...initialState,

  initialize: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const result = await initSeedData();
      set({ seedMessage: result.message });
      await get().loadArtworks();
      await get().loadVolunteers();
      await get().loadInspections();
      await get().loadMaintenances();
      await get().loadComments();
      set({ initialized: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  loadArtworks: async () => {
    set({ loading: true });
    try {
      const artworks = await artworkRepo.getAll();
      set({ artworks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  loadVolunteers: async () => {
    try {
      const volunteers = await volunteerRepo.getAll();
      set({ volunteers });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  loadInspections: async () => {
    try {
      const inspections = await inspectionRepo.getAll();
      set({ inspections });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  loadMaintenances: async () => {
    try {
      const maintenances = await maintenanceRepo.getAll();
      set({ maintenances });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  loadComments: async () => {
    try {
      const comments = await commentRepo.getAll();
      set({ comments });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },

  loadDetail: async (id: number) => {
    set({ loading: true, selectedId: id });
    try {
      const [artwork, inspections, maintenances, comments, photos, userPhotos] = await Promise.all([
        artworkRepo.getById(id),
        inspectionRepo.getByArtworkId(id),
        maintenanceRepo.getByArtworkId(id),
        commentRepo.getByArtworkId(id),
        photoRepo.getByArtworkId(id),
        userPhotoRepo.getByArtworkId(id),
      ]);

      if (!artwork) {
        throw new Error('作品不存在');
      }

      const avgRating = comments.length > 0
        ? comments.reduce((sum, c) => sum + c.rating, 0) / comments.length
        : 0;

      const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);

      set({
        selected: {
          artwork,
          inspections,
          maintenances,
          comments,
          photos,
          userPhotos,
          avgRating,
          totalCost,
        },
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      set({ loading: false });
    }
  },

  clearDetail: () => {
    set({ selected: null, selectedId: null });
  },

  addInspection: async (data: Omit<Inspection, 'id'>) => {
    try {
      await inspectionRepo.create(data);
      await artworkRepo.incrementInspectionCount(data.artworkId);
      await artworkRepo.update(data.artworkId, { statusLatest: data.status });
      await get().loadArtworks();
      await get().loadInspections();
      if (get().selectedId === data.artworkId) {
        await get().loadDetail(data.artworkId);
      }
      const vol = get().volunteers.find(v => v.name === data.volunteer);
      if (vol && vol.id) {
        await volunteerRepo.updateStats(vol.id, 1);
        await get().loadVolunteers();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  addMaintenance: async (data: Omit<Maintenance, 'id'>) => {
    try {
      await maintenanceRepo.create(data);
      await get().loadMaintenances();
      if (get().selectedId === data.artworkId) {
        await get().loadDetail(data.artworkId);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  addComment: async (data: Omit<Comment, 'id'>) => {
    try {
      await commentRepo.create(data);
      await get().loadComments();
      if (get().selectedId === data.artworkId) {
        await get().loadDetail(data.artworkId);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  addUserPhoto: async (data: Omit<UserPhoto, 'id'>) => {
    try {
      await userPhotoRepo.create(data);
      if (get().selectedId === data.artworkId) {
        await get().loadDetail(data.artworkId);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  createArtwork: async (data) => {
    try {
      const id = await artworkRepo.create(data);
      await get().loadArtworks();
      return id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  updateArtwork: async (id, data) => {
    try {
      await artworkRepo.update(id, data);
      await get().loadArtworks();
      if (get().selectedId === id) {
        await get().loadDetail(id);
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  deleteArtwork: async (id) => {
    try {
      await artworkRepo.delete(id);
      await get().loadArtworks();
      if (get().selectedId === id) {
        set({ selected: null, selectedId: null });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  },

  incrementViewCount: async (id) => {
    try {
      await artworkRepo.incrementViewCount(id);
      const artworks = get().artworks.map(a =>
        a.id === id ? { ...a, viewCount: a.viewCount + 1 } : a
      );
      set({ artworks });
    } catch (error) {
      console.error('增加浏览量失败:', error);
    }
  },

  getDashboardStats: async () => {
    const { artworks, volunteers, inspections } = get();

    const typeDistribution: Record<string, number> = {};
    const materialDistribution: Record<string, number> = {};
    const districtDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};

    artworks.forEach(a => {
      typeDistribution[a.type] = (typeDistribution[a.type] || 0) + 1;
      materialDistribution[a.material] = (materialDistribution[a.material] || 0) + 1;
      districtDistribution[a.district] = (districtDistribution[a.district] || 0) + 1;
      statusDistribution[a.statusLatest] = (statusDistribution[a.statusLatest] || 0) + 1;
    });

    const pendingMaintenance = artworks.filter(a =>
      a.statusLatest === InspectionStatus.SEVERE || a.statusLatest === InspectionStatus.MODERATE
    ).sort((a, b) => {
      const order: Record<string, number> = { [InspectionStatus.SEVERE]: 0, [InspectionStatus.MODERATE]: 1 };
      return (order[a.statusLatest] || 99) - (order[b.statusLatest] || 99);
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthInspections = inspections.filter(i => i.date >= monthStart);
    const inspectedArtworkIds = new Set(monthInspections.map(i => i.artworkId));
    const monthlyCoverage = artworks.length > 0
      ? Math.round((inspectedArtworkIds.size / artworks.length) * 100)
      : 0;

    const topVolunteers = [...volunteers]
      .sort((a, b) => b.inspectionCount - a.inspectionCount)
      .slice(0, 10);

    const topArtworks = [...artworks]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    return {
      totalArtworks: artworks.length,
      typeDistribution,
      materialDistribution,
      districtDistribution,
      statusDistribution,
      pendingMaintenance,
      monthlyCoverage,
      topVolunteers,
      topArtworks,
    };
  },

  getArtworksByDistrict: (district: string) => {
    return get().artworks.filter(a => a.district === district);
  },

  getLongUninspectedArtworks: (days = 30) => {
    const { artworks, inspections } = get();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return artworks.filter(artwork => {
      const artworkInspections = inspections.filter(i => i.artworkId === artwork.id);
      if (artworkInspections.length === 0) return true;
      const latest = artworkInspections.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      return new Date(latest.date) < cutoffDate;
    });
  },
}));
