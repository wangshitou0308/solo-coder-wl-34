import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  MapPin,
  AlertTriangle,
  Trash2,
  Eye,
  X,
  Clock,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import {
  ARTWORK_TYPE_OPTIONS,
  DISTRICT_OPTIONS,
  INSPECTION_STATUS_OPTIONS,
  VOLUNTEER_LEVEL_OPTIONS,
  STATUS_COLORS,
  TYPE_COLORS,
  ISSUE_OPTIONS,
} from '@/utils/constants';
import { ArtworkType, InspectionStatus, Artwork } from '@/types';
import { Inspection } from '../../db';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { inspectionRepo } from '../../db';

export default function InspectionsPage() {
  const navigate = useNavigate();
  const { initialize, artworks, inspections, volunteers, loading, addInspection, getLongUninspectedArtworks } = useArtworkStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterVolunteer, setFilterVolunteer] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Inspection | null>(null);
  const [longUninspected, setLongUninspected] = useState<Artwork[]>([]);

  const [formData, setFormData] = useState({
    artworkId: 0,
    status: InspectionStatus.GOOD,
    volunteer: '',
    issues: [] as string[],
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (artworks.length > 0) {
      setLongUninspected(getLongUninspectedArtworks(30));
    }
  }, [artworks, inspections, getLongUninspectedArtworks]);

  const volunteerNames = useMemo(() => {
    const names = new Set(volunteers.map(v => v.name));
    inspections.forEach(i => names.add(i.volunteer));
    return Array.from(names);
  }, [volunteers, inspections]);

  const filteredInspections = useMemo(() => {
    let result = [...inspections];
    if (filterStatus) {
      result = result.filter(i => i.status === filterStatus);
    }
    if (filterVolunteer) {
      result = result.filter(i => i.volunteer === filterVolunteer);
    }
    if (filterDistrict) {
      const artworkIdsInDistrict = artworks.filter(a => a.district === filterDistrict).map(a => a.id);
      result = result.filter(i => artworkIdsInDistrict.includes(i.artworkId));
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(i => {
        const artwork = artworks.find(a => a.id === i.artworkId);
        return (
          i.volunteer.toLowerCase().includes(kw) ||
          i.notes.toLowerCase().includes(kw) ||
          (artwork && artwork.name.toLowerCase().includes(kw))
        );
      });
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inspections, filterStatus, filterVolunteer, filterDistrict, searchKeyword, artworks]);

  const getArtworkName = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.name || '未知作品';
  };

  const getArtworkDistrict = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.district || '';
  };

  const toggleIssue = (issue: string) => {
    setFormData(prev => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.artworkId) return;
    try {
      await addInspection({
        artworkId: formData.artworkId,
        date: new Date(formData.date).toISOString(),
        status: formData.status,
        volunteer: formData.volunteer || '匿名巡查员',
        issues: formData.issues.join('、'),
        notes: formData.notes,
        photos: [],
      });
      setShowFormModal(false);
      setFormData({
        artworkId: 0,
        status: InspectionStatus.GOOD,
        volunteer: '',
        issues: [],
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setLongUninspected(getLongUninspectedArtworks(30));
    } catch (error) {
      console.error('提交巡查记录失败:', error);
    }
  };

  const handleDelete = async (inspection: Inspection) => {
    if (!inspection.id) return;
    try {
      await inspectionRepo.delete(inspection.id);
      setDeleteConfirm(null);
      await useArtworkStore.getState().loadInspections();
    } catch (error) {
      console.error('删除巡查记录失败:', error);
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

  const stats = useMemo(() => {
    const total = inspections.length;
    const statusCounts: Record<string, number> = {};
    inspections.forEach(i => {
      statusCounts[i.status] = (statusCounts[i.status] || 0) + 1;
    });
    return { total, statusCounts };
  }, [inspections]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-primary-600" />
            巡查管理
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            管理志愿者巡查记录，跟踪作品状态变化
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
            onClick={() => setShowFormModal(true)}
          >
            新增巡查
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {INSPECTION_STATUS_OPTIONS.map(status => (
          <div
            key={status}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">{status}</span>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status as InspectionStatus] }}
              />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.statusCounts[status] || 0}
            </p>
          </div>
        ))}
      </div>

      {longUninspected.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">
                长期未巡查作品提醒（超过30天）
              </h3>
              <div className="flex flex-wrap gap-2">
                {longUninspected.slice(0, 8).map(artwork => (
                  <Tag
                    key={artwork.id}
                    color="amber"
                    className="cursor-pointer hover:text-primary-600"
                    onClick={() => artwork.id && navigate(`/artwork/${artwork.id}`)}
                  >
                    {artwork.name} · {artwork.district}
                  </Tag>
                ))}
                {longUninspected.length > 8 && (
                  <Tag color="amber">+{longUninspected.length - 8} 更多</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="搜索作品名称、巡查员、备注..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="h-9"
            />
          </div>
        </div>
        {showFilterPanel && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">巡查状态</label>
              <div className="flex flex-wrap gap-1.5">
                {INSPECTION_STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(filterStatus === s ? null : s)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      filterStatus === s
                        ? 'text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                    style={{
                      backgroundColor: filterStatus === s ? STATUS_COLORS[s as InspectionStatus] : undefined,
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">巡查人员</label>
              <div className="flex flex-wrap gap-1.5">
                {volunteerNames.map(name => (
                  <button
                    key={name}
                    onClick={() => setFilterVolunteer(filterVolunteer === name ? null : name)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      filterVolunteer === name
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {name}
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

      {filteredInspections.length === 0 ? (
        <Empty
          title="暂无巡查记录"
          description="没有找到符合条件的巡查记录"
          action={
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowFormModal(true)}>
              新增巡查
            </Button>
          }
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">作品</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">巡查人员</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">发现问题</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">巡查时间</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">区域</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.map(inspection => (
                  <tr
                    key={inspection.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4">
                      <p
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary-600"
                        onClick={() => inspection.artworkId && navigate(`/artwork/${inspection.artworkId}`)}
                      >
                        {getArtworkName(inspection.artworkId)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Tag color={getStatusTagColor(inspection.status)}>{inspection.status}</Tag>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <User className="w-3.5 h-3.5" />
                        {inspection.volunteer}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {inspection.issues ? (
                        <div className="flex flex-wrap gap-1">
                          {inspection.issues.split('、').filter(Boolean).map((issue, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded"
                            >
                              {issue}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">无</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(inspection.date)}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(inspection.date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="w-3.5 h-3.5" />
                        {getArtworkDistrict(inspection.artworkId)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedInspection(inspection)}
                          title="查看详情"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setDeleteConfirm(inspection)}
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showFormModal && (
        <Modal
          open={true}
          onClose={() => setShowFormModal(false)}
          width="lg"
          title={
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
              <span>新增巡查记录</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowFormModal(false)}>取消</Button>
              <Button onClick={handleSubmit}>提交记录</Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="选择作品"
                value={formData.artworkId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, artworkId: Number(e.target.value) }))}
                options={artworks.map(a => ({ value: String(a.id), label: `${a.name} (${a.district})` }))}
                placeholder="请选择作品"
              />
              <Input
                label="巡查日期"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
              <Select
                label="巡查状态"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as InspectionStatus }))}
                options={INSPECTION_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
              />
              <Input
                label="巡查人员"
                placeholder="请输入巡查人员姓名"
                value={formData.volunteer}
                onChange={(e) => setFormData(prev => ({ ...prev, volunteer: e.target.value }))}
                leftIcon={<User className="w-4 h-4" />}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                发现问题
              </label>
              <div className="flex flex-wrap gap-2">
                {ISSUE_OPTIONS.map(issue => (
                  <button
                    key={issue}
                    onClick={() => toggleIssue(issue)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                      formData.issues.includes(issue)
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-500'
                    )}
                  >
                    {issue}
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              label="备注说明"
              placeholder="请输入巡查备注说明..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {selectedInspection && (
        <Modal
          open={true}
          onClose={() => setSelectedInspection(null)}
          width="lg"
          title={
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
              <span>巡查记录详情</span>
            </div>
          }
          footer={
            <Button variant="ghost" onClick={() => setSelectedInspection(null)}>关闭</Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">作品名称</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getArtworkName(selectedInspection.artworkId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">巡查状态</p>
                <Tag color={getStatusTagColor(selectedInspection.status)}>{selectedInspection.status}</Tag>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">巡查人员</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedInspection.volunteer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">巡查时间</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedInspection.date)}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">发现问题</p>
              {selectedInspection.issues ? (
                <div className="flex flex-wrap gap-2">
                  {selectedInspection.issues.split('、').filter(Boolean).map((issue, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded"
                    >
                      {issue}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">无</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">备注说明</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedInspection.notes || '无'}
              </p>
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
            确定要删除这条巡查记录吗？此操作不可撤销。
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
