import { useEffect, useState, useMemo } from 'react';
import {
  Image,
  Search,
  Filter,
  User,
  Calendar,
  Trash2,
  ZoomIn,
  Camera,
  MapPin,
  X,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import { DISTRICT_OPTIONS } from '@/utils/constants';
import { UserPhoto, Photo } from '../../db';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';
import { userPhotoRepo, photoRepo } from '../../db';

type UnifiedPhoto = {
  id: number;
  artworkId: number;
  url: string;
  source: 'archive' | 'user';
  caption: string;
  photographer: string;
  uploadDate: string;
  category?: string;
};

export default function PhotosPage() {
  const { initialize, artworks, loading } = useArtworkStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterSource, setFilterSource] = useState<'all' | 'archive' | 'user'>('all');
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<UnifiedPhoto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<UnifiedPhoto | null>(null);

  const [userPhotos, setUserPhotos] = useState<UserPhoto[]>([]);
  const [archivePhotos, setArchivePhotos] = useState<Photo[]>([]);

  useEffect(() => {
    initialize();
    loadPhotos();
  }, [initialize]);

  const loadPhotos = async () => {
    try {
      const [ups, aps] = await Promise.all([userPhotoRepo.getAll(), photoRepo.getAll()]);
      setUserPhotos(ups);
      setArchivePhotos(aps);
    } catch (error) {
      console.error('加载照片失败:', error);
    }
  };

  const getArtworkName = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.name || '未知作品';
  };

  const getArtworkDistrict = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.district || '';
  };

  const allPhotos: UnifiedPhoto[] = useMemo(() => {
    const archive: UnifiedPhoto[] = archivePhotos
      .filter(p => p.id !== undefined)
      .map(p => ({
        id: p.id as number,
        artworkId: p.artworkId,
        url: p.url,
        source: 'archive',
        caption: p.caption || '',
        photographer: '官方档案',
        uploadDate: p.uploadedAt,
        category: p.category,
      }));
    const user: UnifiedPhoto[] = userPhotos
      .filter(p => p.id !== undefined)
      .map(p => ({
        id: p.id as number,
        artworkId: p.artworkId,
        url: p.url,
        source: 'user',
        caption: p.description || '',
        photographer: p.author,
        uploadDate: p.date,
      }));
    return [...archive, ...user].sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
  }, [archivePhotos, userPhotos]);

  const filteredPhotos = useMemo(() => {
    let result = [...allPhotos];
    if (filterSource !== 'all') {
      result = result.filter(p => p.source === filterSource);
    }
    if (filterDistrict) {
      const artworkIdsInDistrict = artworks.filter(a => a.district === filterDistrict).map(a => a.id);
      result = result.filter(p => artworkIdsInDistrict.includes(p.artworkId));
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(p => {
        const artwork = artworks.find(a => a.id === p.artworkId);
        return (
          (artwork && artwork.name.toLowerCase().includes(kw)) ||
          (p.caption && p.caption.toLowerCase().includes(kw)) ||
          (p.photographer && p.photographer.toLowerCase().includes(kw))
        );
      });
    }
    return result;
  }, [allPhotos, filterSource, filterDistrict, searchKeyword, artworks]);

  const stats = useMemo(() => {
    const total = allPhotos.length;
    const archiveCount = allPhotos.filter(p => p.source === 'archive').length;
    const userCount = allPhotos.filter(p => p.source === 'user').length;
    const topArtworks: { name: string; count: number }[] = [];
    const artworkPhotos: Record<number, number> = {};
    allPhotos.forEach(p => {
      artworkPhotos[p.artworkId] = (artworkPhotos[p.artworkId] || 0) + 1;
    });
    Object.entries(artworkPhotos).forEach(([artworkId, count]) => {
      const artwork = artworks.find(a => a.id === Number(artworkId));
      if (artwork) {
        topArtworks.push({ name: artwork.name, count });
      }
    });
    topArtworks.sort((a, b) => b.count - a.count);
    return { total, archiveCount, userCount, topArtworks: topArtworks.slice(0, 5) };
  }, [allPhotos, artworks]);

  const handleDelete = async (photo: UnifiedPhoto) => {
    try {
      if (photo.source === 'archive') {
        await photoRepo.delete(photo.id);
      } else {
        await userPhotoRepo.delete(photo.id);
      }
      setDeleteConfirm(null);
      await loadPhotos();
    } catch (error) {
      console.error('删除照片失败:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Image className="w-7 h-7 text-primary-600" />
            照片管理
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            查看和管理公共艺术作品的所有照片，包括档案照片和用户上传
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              网格
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              列表
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            {showFilterPanel ? '收起筛选' : '展开筛选'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Image className="w-4 h-4" />
            照片总数
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Camera className="w-4 h-4" />
            档案照片
          </div>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.archiveCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <User className="w-4 h-4" />
            用户上传
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.userCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <MapPin className="w-4 h-4" />
            覆盖作品数
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.topArtworks.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="搜索作品名称、摄影师、照片说明..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-9"
            />
          </div>
        </div>
        {showFilterPanel && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">照片来源</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'archive', label: '档案照片' },
                  { value: 'user', label: '用户上传' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFilterSource(option.value as 'all' | 'archive' | 'user')}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      filterSource === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">所在区域</label>
              <div className="flex flex-wrap gap-1.5">
                {DISTRICT_OPTIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDistrict(filterDistrict === d ? null : d)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      filterDistrict === d
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {filteredPhotos.length === 0 ? (
        <Empty
          title="暂无照片"
          description="没有找到符合条件的照片"
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 aspect-square cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || '照片'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white text-xs font-medium truncate">
                    {getArtworkName(photo.artworkId)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <Tag color={photo.source === 'archive' ? 'blue' : 'purple'}>
                      {photo.source === 'archive' ? '档案' : '用户'}
                    </Tag>
                    <button
                      className="text-white/80 hover:text-white p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(photo);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <button
                className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(photo);
                }}
              >
                <ZoomIn className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredPhotos.map(photo => (
            <div
              key={photo.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.url}
                alt={photo.caption || '照片'}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {getArtworkName(photo.artworkId)}
                  </span>
                  <Tag color={photo.source === 'archive' ? 'blue' : 'purple'}>
                    {photo.source === 'archive' ? '档案照片' : '用户上传'}
                  </Tag>
                  {photo.category && (
                    <Tag color="gray">{photo.category}</Tag>
                  )}
                </div>
                {photo.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 mb-1">
                    {photo.caption}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {photo.photographer}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(photo.uploadDate)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(photo);
                }}
                title="删除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <Modal
          open={true}
          onClose={() => setSelectedPhoto(null)}
          width="lg"
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-primary-600" />
                <span>{getArtworkName(selectedPhoto.artworkId)}</span>
              </div>
              <button
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || '照片'}
              className="w-full max-h-[60vh] object-contain bg-gray-900 rounded-lg"
            />
            <div className="space-y-2">
              {selectedPhoto.caption && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">说明</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedPhoto.caption}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">来源</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {selectedPhoto.source === 'archive' ? '档案照片' : '用户上传'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">摄影师</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {selectedPhoto.photographer}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">所在区域</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {getArtworkDistrict(selectedPhoto.artworkId)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">上传时间</label>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(selectedPhoto.uploadDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {deleteConfirm && (
        <Modal
          open={true}
          onClose={() => setDeleteConfirm(null)}
          width="md"
          title={
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>确认删除</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>取消</Button>
              <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>确认删除</Button>
            </>
          }
        >
          <p className="text-gray-600 dark:text-gray-300">
            确定要删除这张照片吗？此操作不可撤销。
          </p>
        </Modal>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-[2000]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
