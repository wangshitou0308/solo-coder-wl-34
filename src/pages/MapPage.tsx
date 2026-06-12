import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Search, Filter, Eye, MapPin } from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import { useFilterStore } from '@/store/useFilterStore';
import { TYPE_COLORS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, ARTWORK_TYPE_OPTIONS, DISTRICT_OPTIONS, INSPECTION_STATUS_OPTIONS, MATERIAL_OPTIONS } from '@/utils/constants';
import { ArtworkType, InspectionStatus } from '@/types';
import { Artwork } from '../db';
import ArtworkDetailModal from '@/components/artwork/ArtworkDetailModal';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Tag from '@/components/common/Tag';

function createCustomIcon(type: string, status: string) {
  const color = TYPE_COLORS[type as ArtworkType] || '#6b7280';
  const statusColor = {
    [InspectionStatus.GOOD]: '#22c55e',
    [InspectionStatus.MINOR]: '#84cc16',
    [InspectionStatus.MODERATE]: '#f59e0b',
    [InspectionStatus.SEVERE]: '#ef4444',
    [InspectionStatus.DEMOLISHED]: '#6b7280',
  }[status as InspectionStatus] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 32px;
          height: 32px;
          background: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          background: ${statusColor};
          border-radius: 50%;
          border: 2px solid white;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
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
  const { artworks, loading, initialize, incrementViewCount } = useArtworkStore();
  const { types, materials, yearRange, district, status } = useFilterStore();
  const [selectedArtworkId, setSelectedArtworkId] = useState<number | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const filteredArtworks = artworks.filter(artwork => {
    if (types.length > 0 && !types.includes(artwork.type)) return false;
    if (materials.length > 0 && !materials.includes(artwork.material)) return false;
    if (district && artwork.district !== district) return false;
    if (status && artwork.statusLatest !== status) return false;
    if (yearRange) {
      if (artwork.year < yearRange[0] || artwork.year > yearRange[1]) return false;
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      if (!artwork.name.toLowerCase().includes(keyword) &&
          !artwork.artist.toLowerCase().includes(keyword) &&
          !artwork.address.toLowerCase().includes(keyword)) {
        return false;
      }
    }
    return true;
  });

  const handleMarkerClick = (artwork: Artwork) => {
    if (artwork.id) {
      incrementViewCount(artwork.id);
    }
  };

  const handleOpenDetail = (artwork: Artwork) => {
    if (artwork.id) {
      setSelectedArtworkId(artwork.id);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[600px] relative">
      <div className="absolute top-4 left-4 z-[1000] w-80 space-y-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white text-sm">公共艺术地图</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                共 {filteredArtworks.length} 件作品
              </p>
            </div>
          </div>
          <Input
            placeholder="搜索作品名称、作者、地址..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="h-9"
          />
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 justify-start"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            {showFilterPanel ? '收起筛选' : '展开筛选'}
          </Button>
        </div>

        {showFilterPanel && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">作品类型</h3>
              <div className="flex flex-wrap gap-1.5">
                {ARTWORK_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const { types: currentTypes, setTypes } = useFilterStore.getState();
                      if (currentTypes.includes(type)) {
                        setTypes(currentTypes.filter(t => t !== type));
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
                      backgroundColor: types.includes(type) ? TYPE_COLORS[type as ArtworkType] : undefined,
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
                {DISTRICT_OPTIONS.map(d => (
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
                {MATERIAL_OPTIONS.slice(0, 6).map(mat => (
                  <button
                    key={mat}
                    onClick={() => {
                      const { materials: currentMats, setMaterials } = useFilterStore.getState();
                      if (currentMats.includes(mat)) {
                        setMaterials(currentMats.filter(m => m !== mat));
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
                {INSPECTION_STATUS_OPTIONS.map(s => (
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
                        ? {
                            [InspectionStatus.GOOD]: '#22c55e',
                            [InspectionStatus.MINOR]: '#84cc16',
                            [InspectionStatus.MODERATE]: '#f59e0b',
                            [InspectionStatus.SEVERE]: '#ef4444',
                            [InspectionStatus.DEMOLISHED]: '#6b7280',
                          }[s as InspectionStatus]
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
            类型图例
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {ARTWORK_TYPE_OPTIONS.map(type => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[type as ArtworkType] }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-full">
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
          {filteredArtworks.map(artwork => (
              <Marker
                key={artwork.id}
                position={[artwork.lat, artwork.lng]}
                icon={createCustomIcon(artwork.type, artwork.statusLatest)}
                eventHandlers={{
                  click: () => handleMarkerClick(artwork),
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[240px]">
                    <div className="flex items-start gap-2 mb-2">
                      <Tag
                        color={
                          artwork.type === ArtworkType.SCULPTURE ? 'teal' :
                          artwork.type === ArtworkType.MURAL ? 'purple' :
                          artwork.type === ArtworkType.INSTALLATION ? 'amber' :
                          artwork.type === ArtworkType.FOUNTAIN ? 'blue' :
                          artwork.type === ArtworkType.MONUMENT ? 'red' : 'green'
                        }
                      >
                        {artwork.type}
                      </Tag>
                      <Tag
                        color={
                          artwork.statusLatest === InspectionStatus.GOOD ? 'green' :
                          artwork.statusLatest === InspectionStatus.MINOR ? 'teal' :
                          artwork.statusLatest === InspectionStatus.MODERATE ? 'amber' :
                          artwork.statusLatest === InspectionStatus.SEVERE ? 'red' : 'gray'
                        }
                      >
                        {artwork.statusLatest}
                      </Tag>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {artwork.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {artwork.artist} · {artwork.year}年
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {artwork.material} · {artwork.district}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                      {artwork.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {artwork.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        巡查 {artwork.inspectionCount} 次
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenDetail(artwork)}
                    >
                      查看详情
                    </Button>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {selectedArtworkId && (
        <ArtworkDetailModal
          artworkId={selectedArtworkId}
          onClose={() => setSelectedArtworkId(null)}
        />
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
