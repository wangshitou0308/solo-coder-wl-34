import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  X,
  Palette,
  User,
  Calendar,
  Layers,
  MapPin,
  Building2,
  DollarSign,
  Eye as EyeIcon,
  ClipboardCheck,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import { useFilterStore } from '@/store/useFilterStore';
import {
  ARTWORK_TYPE_OPTIONS,
  DISTRICT_OPTIONS,
  MATERIAL_OPTIONS,
  INSPECTION_STATUS_OPTIONS,
  TYPE_COLORS,
  STATUS_COLORS,
} from '@/utils/constants';
import { ArtworkType, InspectionStatus, Artwork } from '@/types';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import ArtworkDetailModal from '@/components/artwork/ArtworkDetailModal';
import { formatDate } from '@/utils/formatters';

type SortField = 'name' | 'year' | 'viewCount' | 'inspectionCount' | 'createdAt';
type SortOrder = 'asc' | 'desc';

interface ArtworkFormData {
  name: string;
  type: ArtworkType;
  year: number;
  material: string;
  district: string;
  address: string;
  artist: string;
  description: string;
  statusLatest: InspectionStatus;
  lat: number;
  lng: number;
  ownership: string;
  fundingSource: string;
  story: string;
  publicFeedback: string;
}

const emptyForm: ArtworkFormData = {
  name: '',
  type: ArtworkType.SCULPTURE,
  year: new Date().getFullYear(),
  material: MATERIAL_OPTIONS[0],
  district: DISTRICT_OPTIONS[0],
  address: '',
  artist: '',
  description: '',
  statusLatest: InspectionStatus.GOOD,
  lat: 39.9042,
  lng: 116.4074,
  ownership: '',
  fundingSource: '',
  story: '',
  publicFeedback: '',
};

export default function ArtworksListPage() {
  const { initialize, artworks, loading, createArtwork, updateArtwork, deleteArtwork, incrementViewCount } = useArtworkStore();
  const { types, materials, yearRange, district, status, reset } = useFilterStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [formData, setFormData] = useState<ArtworkFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ArtworkFormData, string>>>({});

  const [selectedArtworkId, setSelectedArtworkId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Artwork | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const filteredArtworks = useMemo(() => {
    let result = [...artworks];

    if (types.length > 0) {
      result = result.filter(a => types.includes(a.type));
    }
    if (materials.length > 0) {
      result = result.filter(a => materials.includes(a.material));
    }
    if (district) {
      result = result.filter(a => a.district === district);
    }
    if (status) {
      result = result.filter(a => a.statusLatest === status);
    }
    if (yearRange) {
      result = result.filter(a => a.year >= yearRange[0] && a.year <= yearRange[1]);
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(kw) ||
        a.artist.toLowerCase().includes(kw) ||
        a.address.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'year':
          comparison = a.year - b.year;
          break;
        case 'viewCount':
          comparison = a.viewCount - b.viewCount;
          break;
        case 'inspectionCount':
          comparison = a.inspectionCount - b.inspectionCount;
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [artworks, types, materials, yearRange, district, status, searchKeyword, sortField, sortOrder]);

  const handleToggleFilter = (filterType: 'types' | 'materials', value: string) => {
    const current = filterType === 'types' ? types : materials;
    const setter = filterType === 'types'
      ? useFilterStore.getState().setTypes
      : useFilterStore.getState().setMaterials;
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleOpenAdd = () => {
    setEditingArtwork(null);
    setFormData(emptyForm);
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEdit = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setFormData({
      name: artwork.name,
      type: artwork.type as ArtworkType,
      year: artwork.year,
      material: artwork.material,
      district: artwork.district,
      address: artwork.address,
      artist: artwork.artist,
      description: artwork.description,
      statusLatest: artwork.statusLatest as InspectionStatus,
      lat: artwork.lat,
      lng: artwork.lng,
      ownership: artwork.ownership || '',
      fundingSource: artwork.fundingSource || '',
      story: artwork.story || '',
      publicFeedback: artwork.publicFeedback || '',
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleCloseForm = () => {
    setShowFormModal(false);
    setEditingArtwork(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ArtworkFormData, string>> = {};
    if (!formData.name.trim()) errors.name = '请输入作品名称';
    if (!formData.artist.trim()) errors.artist = '请输入作者';
    if (!formData.address.trim()) errors.address = '请输入地址';
    if (!formData.description.trim()) errors.description = '请输入作品描述';
    if (formData.year < 1900 || formData.year > 2100) errors.year = '请输入有效年份';
    if (!formData.lat || formData.lat < -90 || formData.lat > 90) errors.lat = '请输入有效纬度';
    if (!formData.lng || formData.lng < -180 || formData.lng > 180) errors.lng = '请输入有效经度';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingArtwork && editingArtwork.id) {
        await updateArtwork(editingArtwork.id, formData);
      } else {
        await createArtwork(formData);
      }
      handleCloseForm();
    } catch (error) {
      console.error('保存作品失败:', error);
    }
  };

  const handleDelete = async (artwork: Artwork) => {
    if (!artwork.id) return;
    try {
      await deleteArtwork(artwork.id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('删除作品失败:', error);
    }
  };

  const handleViewDetail = (artwork: Artwork) => {
    if (artwork.id) {
      incrementViewCount(artwork.id);
      setSelectedArtworkId(artwork.id);
    }
  };

  const getTypeTagColor = (type: string): 'teal' | 'purple' | 'amber' | 'blue' | 'red' | 'green' => {
    switch (type) {
      case ArtworkType.SCULPTURE: return 'teal';
      case ArtworkType.MURAL: return 'purple';
      case ArtworkType.INSTALLATION: return 'amber';
      case ArtworkType.FOUNTAIN: return 'blue';
      case ArtworkType.MONUMENT: return 'red';
      case ArtworkType.GRAFFITI: return 'green';
      default: return 'teal';
    }
  };

  const getStatusTagColor = (s: string): 'green' | 'teal' | 'amber' | 'red' | 'gray' => {
    switch (s) {
      case InspectionStatus.GOOD: return 'green';
      case InspectionStatus.MINOR: return 'teal';
      case InspectionStatus.MODERATE: return 'amber';
      case InspectionStatus.SEVERE: return 'red';
      case InspectionStatus.DEMOLISHED: return 'gray';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <List className="w-7 h-7 text-primary-600" />
            作品列表
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            管理所有公共艺术作品档案，共 {artworks.length} 件作品
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
          >
            {showFilterPanel ? '收起筛选' : '展开筛选'}
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            新增作品
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="搜索作品名称、作者、地址..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">排序:</span>
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              options={[
                { value: 'createdAt', label: '创建时间' },
                { value: 'name', label: '作品名称' },
                { value: 'year', label: '创作年份' },
                { value: 'viewCount', label: '浏览量' },
                { value: 'inspectionCount', label: '巡查次数' },
              ]}
              className="h-9 w-32 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-9 w-9 p-0"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {showFilterPanel && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">作品类型</h3>
              <div className="flex flex-wrap gap-1.5">
                {ARTWORK_TYPE_OPTIONS.map(type => (
                  <button
                    key={type}
                    onClick={() => handleToggleFilter('types', type)}
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
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">所在区域</h3>
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
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">作品材质</h3>
              <div className="flex flex-wrap gap-1.5">
                {MATERIAL_OPTIONS.map(mat => (
                  <button
                    key={mat}
                    onClick={() => handleToggleFilter('materials', mat)}
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
              <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">当前状态</h3>
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
                      backgroundColor: status === s ? STATUS_COLORS[s as InspectionStatus] : undefined,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">年代:</span>
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
                  className="h-8 w-24 text-xs"
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
                  className="h-8 w-24 text-xs"
                />
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>重置筛选</Button>
            </div>
          </div>
        )}
      </div>

      {filteredArtworks.length === 0 ? (
        <Empty
          title="暂无作品"
          description="没有找到符合条件的作品，请尝试调整筛选条件或新增作品"
          action={
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
              新增作品
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredArtworks.map(artwork => (
            <div
              key={artwork.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gray-100 dark:bg-gray-700 relative">
                <img
                  src={`https://picsum.photos/seed/art${artwork.id}/600/400`}
                  alt={artwork.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <Tag color={getTypeTagColor(artwork.type)}>{artwork.type}</Tag>
                  <Tag color={getStatusTagColor(artwork.statusLatest)}>{artwork.statusLatest}</Tag>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className="px-2 py-0.5 text-xs bg-black/50 text-white rounded-full flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {artwork.viewCount}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-1">
                    {artwork.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {artwork.artist}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {artwork.year}年
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <Layers className="w-3 h-3" />
                    {artwork.material}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 col-span-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{artwork.district} · {artwork.address}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {artwork.description}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <ClipboardCheck className="w-3 h-3" />
                    巡查 {artwork.inspectionCount} 次
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleViewDetail(artwork)}
                      title="查看详情"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenEdit(artwork)}
                      title="编辑"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteConfirm(artwork)}
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showFormModal && (
        <Modal
          open={true}
          onClose={handleCloseForm}
          width="full"
          title={
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary-600" />
              <span>{editingArtwork ? '编辑作品' : '新增作品'}</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={handleCloseForm}>取消</Button>
              <Button onClick={handleSubmit}>{editingArtwork ? '保存修改' : '创建作品'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="作品名称"
                placeholder="请输入作品名称"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                error={formErrors.name}
              />
              <Input
                label="作者"
                placeholder="请输入作者姓名"
                value={formData.artist}
                onChange={(e) => setFormData(prev => ({ ...prev, artist: e.target.value }))}
                error={formErrors.artist}
              />
              <Select
                label="作品类型"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ArtworkType }))}
                options={ARTWORK_TYPE_OPTIONS.map(t => ({ value: t, label: t }))}
              />
              <Input
                label="创作年份"
                type="number"
                placeholder="请输入创作年份"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                error={formErrors.year}
              />
              <Select
                label="材质工艺"
                value={formData.material}
                onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                options={MATERIAL_OPTIONS.map(m => ({ value: m, label: m }))}
              />
              <Select
                label="当前状态"
                value={formData.statusLatest}
                onChange={(e) => setFormData(prev => ({ ...prev, statusLatest: e.target.value as InspectionStatus }))}
                options={INSPECTION_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
              />
              <Select
                label="所在区域"
                value={formData.district}
                onChange={(e) => setFormData(prev => ({ ...prev, district: e.target.value }))}
                options={DISTRICT_OPTIONS.map(d => ({ value: d, label: d }))}
              />
              <Input
                label="详细地址"
                placeholder="请输入详细地址"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                error={formErrors.address}
              />
              <Input
                label="纬度"
                type="number"
                step="0.0001"
                placeholder="例如 39.9042"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: Number(e.target.value) }))}
                error={formErrors.lat}
              />
              <Input
                label="经度"
                type="number"
                step="0.0001"
                placeholder="例如 116.4074"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: Number(e.target.value) }))}
                error={formErrors.lng}
              />
              <Input
                label="产权归属"
                placeholder="请输入产权归属单位"
                value={formData.ownership}
                onChange={(e) => setFormData(prev => ({ ...prev, ownership: e.target.value }))}
                leftIcon={<Building2 className="w-4 h-4" />}
              />
              <Input
                label="资金来源"
                placeholder="请输入资金来源"
                value={formData.fundingSource}
                onChange={(e) => setFormData(prev => ({ ...prev, fundingSource: e.target.value }))}
                leftIcon={<DollarSign className="w-4 h-4" />}
              />
            </div>
            <Textarea
              label="作品描述"
              placeholder="请输入作品详细描述..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              error={formErrors.description}
              rows={3}
            />
            <Textarea
              label="创作故事"
              placeholder="请输入作品创作背景和故事..."
              value={formData.story}
              onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
              rows={3}
            />
            <Textarea
              label="公众评价"
              placeholder="请输入公众对作品的评价反馈..."
              value={formData.publicFeedback}
              onChange={(e) => setFormData(prev => ({ ...prev, publicFeedback: e.target.value }))}
              rows={2}
            />
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
            确定要删除作品 <span className="font-semibold text-gray-900 dark:text-white">「{deleteConfirm.name}」</span> 吗？
            此操作不可撤销，相关的巡查记录、维护记录和评论也将受到影响。
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
