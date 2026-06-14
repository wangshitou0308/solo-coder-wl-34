import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Filter,
  Layers,
  AlertTriangle,
  X,
  MapPin,
  Eye,
  ClipboardCheck,
  Wrench,
  Heart,
  ArrowRight,
  ChevronDown,
  Trash2,
  Navigation,
  Plus,
  Route,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useArtworkStore } from '@/store/useArtworkStore';
import { useFilterStore } from '@/store/useFilterStore';
import {
  MAP_LAYER_OPTIONS,
  TYPE_COLORS,
  STATUS_COLORS,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  ARTWORK_TYPE_OPTIONS,
  DISTRICT_OPTIONS,
  DISTRICT_INFO,
  MATERIAL_OPTIONS,
  INSPECTION_STATUS_OPTIONS,
  RISK_LEVEL,
  NEARBY_DISTANCE_KM,
} from '@/utils/constants';
import { MapLayerType, ArtworkType, InspectionStatus } from '@/types';
import { Artwork } from '../db';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Tag from '@/components/common/Tag';
import Empty from '@/components/common/Empty';
import { haversineDistance } from '@/utils/distance';

interface DistrictStats {
  total: number;
  pendingMaintenance: number;
  avgRating: number;
  coverageRate: number;
}

function createCustomIcon(
  layerType: MapLayerType,
  type: string,
  status: string,
  viewCount: number,
  inspectedWithin30Days: boolean,
  isSelected: boolean
) {
  let mainColor = '#6b7280';
  let size = 32;
  let innerSize = 12;
  let borderWidth = 3;

  if (layerType === MapLayerType.TYPE) {
    mainColor = TYPE_COLORS[type as ArtworkType] || '#6b7280';
  } else if (layerType === MapLayerType.RISK) {
    mainColor = STATUS_COLORS[status as InspectionStatus] || '#6b7280';
    if (status === InspectionStatus.SEVERE || status === InspectionStatus.DEMOLISHED) {
      size = 40;
      innerSize = 14;
      borderWidth = 4;
    }
  } else if (layerType === MapLayerType.COVERAGE) {
    mainColor = inspectedWithin30Days ? '#22c55e' : '#9ca3af';
  } else if (layerType === MapLayerType.POPULAR) {
    mainColor = '#f59e0b';
    const baseSize = 24;
    const maxSize = 56;
    const normalizedViews = Math.min(viewCount / 500, 1);
    size = Math.round(baseSize + normalizedViews * (maxSize - baseSize));
    innerSize = Math.round(8 + normalizedViews * 8);
  }

  const selectedRing = isSelected
    ? `<div style="position:absolute;top:-6px;left:-6px;right:-6px;bottom:-6px;border:3px solid #3b82f6;border-radius:50%;box-shadow:0 0 0 2px rgba(59,130,246,0.3);"></div>`
    : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        ${selectedRing}
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${mainColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: ${borderWidth}px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          bottom: ${-innerSize / 2 + 2}px;
          right: ${-innerSize / 2 + 2}px;
          width: ${innerSize}px;
          height: ${innerSize}px;
          background: white;
          border-radius: 50%;
          border: 2px solid ${mainColor};
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const {
    artworks,
    loading,
    initialize,
    incrementViewCount,
    inspections,
    comments,
    getNearbyArtworks,
    toggleFavorite,
    isArtworkFavorited,
  } = useArtworkStore();
  const { types, materials, yearRange, district, status, setDistrict } = useFilterStore();

  const [layerType, setLayerType] = useState<MapLayerType>(MapLayerType.TYPE);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [riskMode, setRiskMode] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districtStats, setDistrictStats] = useState<DistrictStats | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [nearbyArtworks, setNearbyArtworks] = useState<
    { artwork: Artwork; distanceKm: number }[]
  >([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setSidebarOpen(false);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const inspectedArtworkIdsWithin30Days = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const ids = new Set<number>();
    inspections.forEach((ins) => {
      if (new Date(ins.date) >= cutoff) {
        ids.add(ins.artworkId);
      }
    });
    return ids;
  }, [inspections]);

  const getArtworkAvgRating = useCallback(
    (artworkId: number): number => {
      const artworkComments = comments.filter((c) => c.artworkId === artworkId);
      if (artworkComments.length === 0) return 0;
      return (
        artworkComments.reduce((sum, c) => sum + c.rating, 0) / artworkComments.length
      );
    },
    [comments]
  );

  const filteredArtworks = useMemo(() => {
    let result = artworks.filter((artwork) => {
      if (types.length > 0 && !types.includes(artwork.type)) return false;
      if (materials.length > 0 && !materials.includes(artwork.material)) return false;
      if (district && artwork.district !== district) return false;
      if (status && artwork.statusLatest !== status) return false;
      if (yearRange) {
        if (artwork.year < yearRange[0] || artwork.year > yearRange[1]) return false;
      }
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        if (
          !artwork.name.toLowerCase().includes(keyword) &&
          !artwork.artist.toLowerCase().includes(keyword) &&
          !artwork.address.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      return true;
    });

    if (riskMode) {
      result = result.filter(
        (a) =>
          a.statusLatest === InspectionStatus.MODERATE ||
          a.statusLatest === InspectionStatus.SEVERE ||
          a.statusLatest === InspectionStatus.DEMOLISHED
      );
      result = result.sort(
        (a, b) =>
          (RISK_LEVEL[b.statusLatest as InspectionStatus] || 0) -
          (RISK_LEVEL[a.statusLatest as InspectionStatus] || 0)
      );
    }

    return result;
  }, [artworks, types, materials, district, status, yearRange, searchKeyword, riskMode]);

  const selectedTotalDistance = useMemo(() => {
    if (selectedIds.size < 2) return 0;
    const selectedList = artworks.filter(
      (a) => a.id !== undefined && selectedIds.has(a.id)
    );
    let total = 0;
    for (let i = 0; i < selectedList.length - 1; i++) {
      total += haversineDistance(
        { latitude: selectedList[i].lat, longitude: selectedList[i].lng },
        { latitude: selectedList[i + 1].lat, longitude: selectedList[i + 1].lng }
      );
    }
    return total;
  }, [selectedIds, artworks]);

  const handleMarkerClick = (artwork: Artwork, e: L.LeafletMouseEvent) => {
    if (artwork.id) {
      incrementViewCount(artwork.id);
    }

    if (isShiftPressed || e.originalEvent.shiftKey) {
      if (artwork.id !== undefined) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(artwork.id)) {
            next.delete(artwork.id);
          } else {
            next.add(artwork.id);
          }
          return next;
        });
      }
      return;
    }

    setSelectedArtwork(artwork);
    setSidebarOpen(true);
    if (artwork.id !== undefined) {
      setNearbyArtworks(getNearbyArtworks(artwork.id, NEARBY_DISTANCE_KM));
      setIsFavorited(isArtworkFavorited(artwork.id));
    }
  };

  const handleMarkerMouseDown = (artwork: Artwork) => {
    longPressTimerRef.current = window.setTimeout(() => {
      if (artwork.id !== undefined) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(artwork.id)) {
            next.delete(artwork.id);
          } else {
            next.add(artwork.id);
          }
          return next;
        });
      }
    }, 500);
  };

  const handleMarkerMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDistrictClick = (d: string) => {
    const districtArtworks = artworks.filter((a) => a.district === d);
    const pendingMaintenance = districtArtworks.filter(
      (a) =>
        a.statusLatest === InspectionStatus.MODERATE ||
        a.statusLatest === InspectionStatus.SEVERE
    ).length;

    let totalRating = 0;
    let ratedCount = 0;
    districtArtworks.forEach((a) => {
      if (a.id !== undefined) {
        const r = getArtworkAvgRating(a.id);
        if (r > 0) {
          totalRating += r;
          ratedCount++;
        }
      }
    });
    const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const districtInspectedIds = new Set<number>();
    inspections.forEach((ins) => {
      const artwork = artworks.find((a) => a.id === ins.artworkId);
      if (artwork && artwork.district === d && new Date(ins.date) >= cutoff) {
        districtInspectedIds.add(ins.artworkId);
      }
    });
    const coverageRate =
      districtArtworks.length > 0
        ? Math.round((districtInspectedIds.size / districtArtworks.length) * 100)
        : 0;

    setDistrictStats({
      total: districtArtworks.length,
      pendingMaintenance,
      avgRating,
      coverageRate,
    });
    setSelectedDistrict(d);
    setDistrict(d);

    const info = DISTRICT_INFO[d];
    if (info && mapRef.current) {
      mapRef.current.setView(info.center, 13);
    }
  };

  const handleToggleFavorite = async () => {
    if (selectedArtwork?.id !== undefined) {
      const result = await toggleFavorite(selectedArtwork.id);
      setIsFavorited(result);
    }
  };

  const handlePreviewRoute = () => {
    const ids = Array.from(selectedIds);
    navigate(`/path?ids=${ids.join(',')}`);
  };

  const getStatusTagColor = (statusVal: string): 'green' | 'teal' | 'amber' | 'red' | 'gray' => {
    switch (statusVal as InspectionStatus) {
      case InspectionStatus.GOOD:
        return 'green';
      case InspectionStatus.MINOR:
        return 'teal';
      case InspectionStatus.MODERATE:
        return 'amber';
      case InspectionStatus.SEVERE:
        return 'red';
      default:
        return 'gray';
    }
  };

  const getTypeTagColor = (typeVal: string): 'teal' | 'purple' | 'amber' | 'blue' | 'red' | 'green' => {
    switch (typeVal as ArtworkType) {
      case ArtworkType.SCULPTURE:
        return 'teal';
      case ArtworkType.MURAL:
        return 'purple';
      case ArtworkType.INSTALLATION:
        return 'amber';
      case ArtworkType.FOUNTAIN:
        return 'blue';
      case ArtworkType.MONUMENT:
        return 'red';
      case ArtworkType.GRAFFITI:
        return 'green';
      default:
        return 'teal';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] relative">
      {riskMode && (
        <div className="absolute top-0 left-0 right-0 z-[1001] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium text-sm">高风险模式 - 仅显示中等、严重、已拆除状态作品</span>
          <button
            onClick={() => setRiskMode(false)}
            className="ml-2 hover:bg-red-700 px-2 py-0.5 rounded text-xs"
          >
            关闭
          </button>
        </div>
      )}

      <div className={cn('absolute top-4 left-4 z-[1000] w-80 space-y-3', riskMode && 'top-12')}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">公共艺术地图</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                共 {filteredArtworks.length} 件作品
              </p>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Layers className="w-4 h-4" />}
                onClick={() => setShowLayerPanel(!showLayerPanel)}
              />
              {showLayerPanel && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 w-48 z-50">
                  {MAP_LAYER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setLayerType(opt.value);
                        setShowLayerPanel(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm rounded-md transition-colors',
                        layerType === opt.value
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 mb-3">
            {MAP_LAYER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setLayerType(opt.value)}
                className={cn(
                  'flex-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors border',
                  layerType === opt.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Input
            placeholder="搜索作品名称、作者、地址..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9"
          />
          <div className="flex gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start"
              leftIcon={<Filter className="w-4 h-4" />}
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              {showFilterPanel ? '收起筛选' : '展开筛选'}
            </Button>
            <Button
              variant={riskMode ? 'danger' : 'ghost'}
              size="sm"
              leftIcon={<AlertTriangle className="w-4 h-4" />}
              onClick={() => setRiskMode(!riskMode)}
            >
              {riskMode ? '高风险' : '风险'}
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            行政区
          </h3>
          <div className="grid grid-cols-5 gap-1">
            {DISTRICT_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => handleDistrictClick(d)}
                className={cn(
                  'px-1 py-1.5 text-xs font-medium rounded-md transition-colors border',
                  selectedDistrict === d
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                )}
              >
                {d.slice(0, -1)}
              </button>
            ))}
          </div>
        </div>

        {selectedDistrict && districtStats && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedDistrict} 统计
              </h3>
              <button
                onClick={() => {
                  setSelectedDistrict(null);
                  setDistrictStats(null);
                  setDistrict(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {districtStats.total}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">作品总数</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">
                  {districtStats.pendingMaintenance}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">待维护</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {districtStats.avgRating > 0 ? districtStats.avgRating.toFixed(1) : '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">平均评分</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {districtStats.coverageRate}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">巡查覆盖率</div>
              </div>
            </div>
          </div>
        )}

        {showFilterPanel && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4 max-h-[50vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">作品类型</h3>
              <div className="flex flex-wrap gap-1.5">
                {ARTWORK_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const { types: currentTypes, setTypes } = useFilterStore.getState();
                      if (currentTypes.includes(type)) {
                        setTypes(currentTypes.filter((t) => t !== type));
                      } else {
                        setTypes([...currentTypes, type]);
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      types.includes(type)
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                    style={{
                      backgroundColor: types.includes(type)
                        ? TYPE_COLORS[type as ArtworkType]
                        : undefined,
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">所在区域</h3>
              <div className="flex flex-wrap gap-1.5">
                {DISTRICT_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      const { setDistrict: setD } = useFilterStore.getState();
                      setD(district === d ? null : d);
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      district === d
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">作品材质</h3>
              <div className="flex flex-wrap gap-1.5">
                {MATERIAL_OPTIONS.slice(0, 6).map((mat) => (
                  <button
                    key={mat}
                    onClick={() => {
                      const { materials: currentMats, setMaterials } = useFilterStore.getState();
                      if (currentMats.includes(mat)) {
                        setMaterials(currentMats.filter((m) => m !== mat));
                      } else {
                        setMaterials([...currentMats, mat]);
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      materials.includes(mat)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {mat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">当前状态</h3>
              <div className="flex flex-wrap gap-1.5">
                {INSPECTION_STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      const { setStatus: setS } = useFilterStore.getState();
                      setS(status === s ? null : s);
                    }}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      status === s
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                    style={{
                      backgroundColor: status === s
                        ? STATUS_COLORS[s as InspectionStatus]
                        : undefined,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">创作年代</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="起始年"
                  value={yearRange?.[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    const { setYearRange } = useFilterStore.getState();
                    if (val === null && !yearRange?.[1]) {
                      setYearRange(null);
                    } else {
                      setYearRange([val || 1900, yearRange?.[1] || 2030]);
                    }
                  }}
                  className="h-8 text-xs"
                />
                <span className="text-gray-400 text-sm">-</span>
                <Input
                  type="number"
                  placeholder="结束年"
                  value={yearRange?.[1] || ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    const { setYearRange } = useFilterStore.getState();
                    if (val === null && !yearRange?.[0]) {
                      setYearRange(null);
                    } else {
                      setYearRange([yearRange?.[0] || 1900, val || 2030]);
                    }
                  }}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => useFilterStore.getState().reset()}
            >
              重置筛选
            </Button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3">
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {layerType === MapLayerType.TYPE && '类型图例'}
            {layerType === MapLayerType.RISK && '风险图例'}
            {layerType === MapLayerType.COVERAGE && '巡查图例'}
            {layerType === MapLayerType.POPULAR && '热度图例'}
          </h3>
          {layerType === MapLayerType.TYPE && (
            <div className="grid grid-cols-3 gap-2">
              {ARTWORK_TYPE_OPTIONS.map((type) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[type as ArtworkType] }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{type}</span>
                </div>
              ))}
            </div>
          )}
          {layerType === MapLayerType.RISK && (
            <div className="grid grid-cols-2 gap-2">
              {INSPECTION_STATUS_OPTIONS.map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      (s === InspectionStatus.SEVERE || s === InspectionStatus.DEMOLISHED) &&
                        'w-4 h-4'
                    )}
                    style={{ backgroundColor: STATUS_COLORS[s as InspectionStatus] }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300">{s}</span>
                </div>
              ))}
            </div>
          )}
          {layerType === MapLayerType.COVERAGE && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">30天内已巡查</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">超期未巡查</span>
              </div>
            </div>
          )}
          {layerType === MapLayerType.POPULAR && (
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">低</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">中</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-amber-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">高</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'w-full h-full transition-all duration-300',
          sidebarOpen && 'pr-[380px]',
          selectedIds.size > 0 && 'pb-20'
        )}
      >
        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoom={DEFAULT_MAP_ZOOM}
          className="w-full h-full rounded-xl"
          ref={mapRef as any}
        >
          <ChangeView center={DEFAULT_MAP_CENTER} zoom={DEFAULT_MAP_ZOOM} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredArtworks.map((artwork) => {
            const inspectedWithin30Days =
              artwork.id !== undefined && inspectedArtworkIdsWithin30Days.has(artwork.id);
            const isSelected = artwork.id !== undefined && selectedIds.has(artwork.id);
            return (
              <Marker
                key={artwork.id}
                position={[artwork.lat, artwork.lng]}
                icon={createCustomIcon(
                  layerType,
                  artwork.type,
                  artwork.statusLatest,
                  artwork.viewCount,
                  inspectedWithin30Days,
                  isSelected
                )}
                eventHandlers={{
                  click: (e) => handleMarkerClick(artwork, e),
                  mousedown: () => handleMarkerMouseDown(artwork),
                  mouseup: handleMarkerMouseUp,
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {sidebarOpen && selectedArtwork && (
        <div className="absolute top-0 right-0 h-full w-[380px] bg-white dark:bg-gray-800 shadow-2xl z-[1000] flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">作品详情</h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-2 flex-wrap">
                <Tag color={getTypeTagColor(selectedArtwork.type)}>{selectedArtwork.type}</Tag>
                <Tag color={getStatusTagColor(selectedArtwork.statusLatest)}>
                  {selectedArtwork.statusLatest}
                </Tag>
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedArtwork.name}
              </h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">作者</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {selectedArtwork.artist}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">创作年份</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {selectedArtwork.year}年
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">材质</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {selectedArtwork.material}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">所在区域</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {selectedArtwork.district}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">地址</div>
                <div className="text-gray-900 dark:text-white text-sm">
                  {selectedArtwork.address}
                </div>
              </div>

              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">描述</div>
                <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {selectedArtwork.description}
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Eye className="w-4 h-4" />
                  {selectedArtwork.viewCount} 浏览
                </span>
                <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <ClipboardCheck className="w-4 h-4" />
                  {selectedArtwork.inspectionCount} 巡查
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  leftIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => navigate(`/artwork/${selectedArtwork.id}`)}
                >
                  查看详情
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Heart className={cn('w-4 h-4', isFavorited && 'fill-red-500 text-red-500')} />}
                  onClick={handleToggleFavorite}
                >
                  {isFavorited ? '已收藏' : '收藏'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => navigate(`/artwork/${selectedArtwork.id}?tab=inspection`)}
                >
                  新增巡查
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Wrench className="w-4 h-4" />}
                  onClick={() => navigate(`/artwork/${selectedArtwork.id}?tab=maintenance`)}
                >
                  新增维护
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary-600" />
                附近作品推荐
              </h3>
              {nearbyArtworks.length === 0 ? (
                <Empty
                  title="附近暂无作品"
                  description="2公里范围内未发现其他公共艺术作品"
                  className="py-6"
                />
              ) : (
                <div className="space-y-2">
                  {nearbyArtworks.slice(0, 5).map((item) => (
                    <button
                      key={item.artwork.id}
                      onClick={() => {
                        if (item.artwork.id) {
                          incrementViewCount(item.artwork.id);
                        }
                        setSelectedArtwork(item.artwork);
                        if (item.artwork.id !== undefined) {
                          setNearbyArtworks(getNearbyArtworks(item.artwork.id, NEARBY_DISTANCE_KM));
                          setIsFavorited(isArtworkFavorited(item.artwork.id));
                        }
                        if (mapRef.current) {
                          mapRef.current.setView([item.artwork.lat, item.artwork.lng], 15);
                        }
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.artwork.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.distanceKm < 1
                            ? `${Math.round(item.distanceKm * 1000)}m`
                            : `${item.distanceKm.toFixed(1)}km`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag color={getTypeTagColor(item.artwork.type)}>
                          {item.artwork.type}
                        </Tag>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {item.artwork.artist}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Route className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                已选择 {selectedIds.size} 件作品
              </div>
              {selectedIds.size >= 2 && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  总距离约 {selectedTotalDistance < 1
                    ? `${Math.round(selectedTotalDistance * 1000)}m`
                    : `${selectedTotalDistance.toFixed(2)}km`}
                </div>
              )}
            </div>
          </div>
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
          <Button
            size="sm"
            leftIcon={<Navigation className="w-4 h-4" />}
            onClick={handlePreviewRoute}
            disabled={selectedIds.size < 2}
          >
            预览路线
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={() => setSelectedIds(new Set())}
          >
            清空
          </Button>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-[2000]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-300">加载中...</p>
          </div>
        </div>
      )}
    </div>
  );
}
