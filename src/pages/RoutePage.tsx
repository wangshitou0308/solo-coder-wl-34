import { useEffect, useState, useMemo } from 'react';
import {
  Map as MapIcon,
  Search,
  Route,
  Filter,
  RefreshCw,
  Navigation,
  Clock,
  Footprints,
  ChevronRight,
  Share2,
  Download,
  Sparkles,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import {
  DISTRICT_OPTIONS,
  ARTWORK_TYPE_OPTIONS,
  TYPE_COLORS,
} from '@/utils/constants';
import { ArtworkType, Coordinates } from '@/types';
import { Artwork } from '../../db';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Tag from '@/components/common/Tag';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import { haversineDistance, nearestNeighborRoute, estimateWalkTime, formatWalkTime } from '@/utils/distance';
import { formatDistance } from '@/utils/formatters';

type RouteArtwork = Artwork & { id: number; coordinates: Coordinates };

type LocatableArtwork = {
  id: string;
  coordinates: Coordinates;
  artwork: Artwork;
};

export default function RoutePage() {
  const { initialize, artworks, comments, loading } = useArtworkStore();

  const [selectedDistrict, setSelectedDistrict] = useState<string>('全部区域');
  const [selectedTypes, setSelectedTypes] = useState<ArtworkType[]>([]);
  const [maxArtworks, setMaxArtworks] = useState<number>(8);
  const [startPointId, setStartPointId] = useState<string>('');
  const [routeArtworks, setRouteArtworks] = useState<Artwork[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const getArtworkRating = (artworkId: number): number => {
    const artworkComments = comments.filter(c => c.artworkId === artworkId);
    if (artworkComments.length === 0) return 0;
    return artworkComments.reduce((sum, c) => sum + c.rating, 0) / artworkComments.length;
  };

  const toLocatable = (artwork: Artwork): LocatableArtwork | null => {
    if (artwork.id === undefined) return null;
    return {
      id: artwork.id.toString(),
      coordinates: { latitude: artwork.lat, longitude: artwork.lng },
      artwork,
    };
  };

  const availableArtworks = useMemo(() => {
    let result = [...artworks];
    if (selectedDistrict !== '全部区域') {
      result = result.filter(a => a.district === selectedDistrict);
    }
    if (selectedTypes.length > 0) {
      result = result.filter(a => selectedTypes.includes(a.type as ArtworkType));
    }
    return result;
  }, [artworks, selectedDistrict, selectedTypes]);

  const routeStats = useMemo(() => {
    if (routeArtworks.length < 2) {
      return { totalDistanceKm: 0, estimatedMinutes: 0 };
    }
    let totalDistanceKm = 0;
    for (let i = 0; i < routeArtworks.length - 1; i++) {
      totalDistanceKm += haversineDistance(
        { latitude: routeArtworks[i].lat, longitude: routeArtworks[i].lng },
        { latitude: routeArtworks[i + 1].lat, longitude: routeArtworks[i + 1].lng }
      );
    }
    const estimatedMinutes = estimateWalkTime(totalDistanceKm);
    return { totalDistanceKm, estimatedMinutes };
  }, [routeArtworks]);

  const toggleType = (type: ArtworkType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleGenerateRoute = async () => {
    if (availableArtworks.length === 0) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const locatable: LocatableArtwork[] = availableArtworks
      .map(toLocatable)
      .filter((a): a is LocatableArtwork => a !== null);

    if (locatable.length === 0) {
      setIsGenerating(false);
      return;
    }

    const start = startPointId
      ? locatable.find(a => a.id === startPointId) || locatable[0]
      : locatable[0];

    const limit = Math.min(maxArtworks, locatable.length);
    const limitedList = locatable.slice(0, Math.max(limit * 3, limit));
    const result = nearestNeighborRoute(limitedList, start, false);
    const finalRoute: Artwork[] = result.orderedPoints
      .slice(0, limit)
      .map(p => (p as LocatableArtwork).artwork);
    setRouteArtworks(finalRoute);
    setIsGenerating(false);
  };

  const handleRegenerate = () => {
    if (availableArtworks.length === 0) return;
    setIsGenerating(true);
    setTimeout(() => {
      const shuffled = [...availableArtworks].sort(() => Math.random() - 0.5);
      const start = shuffled[0];
      if (start && start.id) {
        setStartPointId(start.id.toString());
      }
      handleGenerateRoute();
    }, 400);
  };

  const getTypeColor = (type: string): string => {
    return TYPE_COLORS[type as ArtworkType] || '#6b7280';
  };

  const getTypeTagColor = (type: string): 'teal' | 'purple' | 'amber' | 'blue' | 'red' | 'green' | 'gray' => {
    switch (type as ArtworkType) {
      case ArtworkType.SCULPTURE: return 'teal';
      case ArtworkType.MURAL: return 'purple';
      case ArtworkType.INSTALLATION: return 'amber';
      case ArtworkType.FOUNTAIN: return 'blue';
      case ArtworkType.MONUMENT: return 'red';
      case ArtworkType.GRAFFITI: return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Route className="w-7 h-7 text-primary-600" />
            漫步路线生成
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            按区域和类型生成公共艺术漫步路线，串联沿途作品形成文化导览
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary-600" />
              路线筛选条件
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  所在区域
                </label>
                <Select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  options={[{ value: '全部区域', label: '全部区域' }, ...DISTRICT_OPTIONS.map(d => ({ value: d, label: d }))]}
                  className="h-9"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  艺术类型
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {ARTWORK_TYPE_OPTIONS.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={cn(
                        'px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 border',
                        selectedTypes.includes(type)
                          ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                      )}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getTypeColor(type) }}
                      />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  最大作品数：{maxArtworks} 件
                </label>
                <input
                  type="range"
                  min={3}
                  max={15}
                  value={maxArtworks}
                  onChange={(e) => setMaxArtworks(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  起点作品（可选）
                </label>
                <Select
                  value={startPointId}
                  onChange={(e) => setStartPointId(e.target.value)}
                  options={[
                    { value: '', label: '自动选择' },
                    ...availableArtworks.filter(a => a.id).map(a => ({ value: a.id!.toString(), label: a.name }))
                  ]}
                  className="h-9"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  共 <span className="font-semibold text-gray-900 dark:text-white">{availableArtworks.length}</span> 件作品可选
                </span>
              </div>

              <Button
                className="w-full"
                leftIcon={isGenerating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                onClick={handleGenerateRoute}
                disabled={availableArtworks.length === 0 || isGenerating}
              >
                {isGenerating ? '生成中...' : '生成漫步路线'}
              </Button>
            </div>
          </div>

          {routeArtworks.length > 0 && (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-primary-100 dark:border-primary-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary-600" />
                路线概览
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Footprints className="w-4 h-4" />
                    <span className="text-sm">作品数量</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {routeArtworks.length} 件
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Route className="w-4 h-4" />
                    <span className="text-sm">总距离</span>
                  </div>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {formatDistance(routeStats.totalDistanceKm * 1000)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">预计时长</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    约 {formatWalkTime(routeStats.estimatedMinutes)}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                  onClick={handleRegenerate}
                >
                  换一条
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  leftIcon={<Share2 className="w-4 h-4" />}
                >
                  分享
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {routeArtworks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-full min-h-[500px]">
              <Empty
                title="开始生成漫步路线"
                description="在左侧设置筛选条件，点击生成路线，为您规划最佳的公共艺术漫步之旅"
                action={
                  availableArtworks.length > 0 && (
                    <Button
                      leftIcon={<Sparkles className="w-4 h-4" />}
                      onClick={handleGenerateRoute}
                    >
                      立即生成
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <MapIcon className="w-4 h-4 text-primary-600" />
                      公共艺术漫步路线
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {routeArtworks[0]?.district} · {routeArtworks.length} 件作品 · {formatDistance(routeStats.totalDistanceKm * 1000)} · 约 {formatWalkTime(routeStats.estimatedMinutes)}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                    导出
                  </Button>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-0">
                  {routeArtworks.map((artwork, index) => {
                    const rating = getArtworkRating(artwork.id!);
                    return (
                      <div key={artwork.id} className="relative">
                        {index > 0 && (
                          <div
                            className="absolute left-[19px] top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                            style={{ height: 'calc(100% + 8px)' }}
                          />
                        )}
                        <div className="flex items-start gap-3 pb-4 relative">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md z-10 border-4 border-white dark:border-gray-800',
                              index === 0 ? 'bg-green-500' :
                              index === routeArtworks.length - 1 ? 'bg-red-500' :
                              'bg-primary-600'
                            )}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                    {artwork.name}
                                  </h4>
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: getTypeColor(artwork.type) }}
                                  />
                                  <Tag color={getTypeTagColor(artwork.type)}>
                                    {artwork.type}
                                  </Tag>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {artwork.artist && (
                                    <span className="truncate">作者：{artwork.artist}</span>
                                  )}
                                  {artwork.year && (
                                    <span>{artwork.year}年</span>
                                  )}
                                  {rating > 0 && (
                                    <span className="text-amber-500">
                                      ★ {rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                                {artwork.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {artwork.description}
                                  </p>
                                )}
                              </div>
                              {index < routeArtworks.length - 1 && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 flex-shrink-0">
                                  {formatDistance(
                                    haversineDistance(
                                      { latitude: artwork.lat, longitude: artwork.lng },
                                      { latitude: routeArtworks[index + 1].lat, longitude: routeArtworks[index + 1].lng }
                                    ) * 1000
                                  )}
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
