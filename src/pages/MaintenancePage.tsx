import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  Calendar,
  Building2,
  DollarSign,
  Trash2,
  Eye,
  Check,
  Clock,
  List,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import {
  MAINTENANCE_TYPE_OPTIONS,
  DISTRICT_OPTIONS,
} from '@/utils/constants';
import { Maintenance, Artwork } from '../../db';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';
import Textarea from '@/components/common/Textarea';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import { formatDate, formatCurrency, formatRelativeTime } from '@/utils/formatters';
import { maintenanceRepo } from '../../db';

export default function MaintenancePage() {
  const navigate = useNavigate();
  const { initialize, artworks, maintenances, loading, addMaintenance } = useArtworkStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Maintenance | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Maintenance | null>(null);

  const [formData, setFormData] = useState({
    artworkId: 0,
    date: new Date().toISOString().split('T')[0],
    workType: MAINTENANCE_TYPE_OPTIONS[0],
    contractor: '',
    cost: 0,
    description: '',
    completed: true,
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  const getArtworkName = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.name || '未知作品';
  };

  const getArtworkDistrict = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.district || '';
  };

  const filteredMaintenances = useMemo(() => {
    let result = [...maintenances];
    if (filterType) {
      result = result.filter(m => m.workType === filterType);
    }
    if (filterDistrict) {
      const artworkIdsInDistrict = artworks.filter(a => a.district === filterDistrict).map(a => a.id);
      result = result.filter(m => artworkIdsInDistrict.includes(m.artworkId));
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(m => {
        const artwork = artworks.find(a => a.id === m.artworkId);
        return (
          m.contractor.toLowerCase().includes(kw) ||
          m.description.toLowerCase().includes(kw) ||
          (artwork && artwork.name.toLowerCase().includes(kw))
        );
      });
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [maintenances, filterType, filterDistrict, searchKeyword, artworks]);

  const stats = useMemo(() => {
    const total = maintenances.length;
    const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
    const typeCounts: Record<string, number> = {};
    maintenances.forEach(m => {
      typeCounts[m.workType] = (typeCounts[m.workType] || 0) + 1;
    });
    const artworkCosts: Record<number, number> = {};
    maintenances.forEach(m => {
      artworkCosts[m.artworkId] = (artworkCosts[m.artworkId] || 0) + (m.cost || 0);
    });
    const topCostArtworks = Object.entries(artworkCosts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, cost]) => ({ artworkId: Number(id), cost }));
    return { total, totalCost, typeCounts, topCostArtworks };
  }, [maintenances]);

  const handleSubmit = async () => {
    if (!formData.artworkId) return;
    try {
      await addMaintenance({
        artworkId: formData.artworkId,
        date: new Date(formData.date).toISOString(),
        contractor: formData.contractor,
        workType: formData.workType,
        cost: formData.cost,
        description: formData.description,
        completed: formData.completed,
      });
      setShowFormModal(false);
      setFormData({
        artworkId: 0,
        date: new Date().toISOString().split('T')[0],
        workType: MAINTENANCE_TYPE_OPTIONS[0],
        contractor: '',
        cost: 0,
        description: '',
        completed: true,
      });
    } catch (error) {
      console.error('提交维护记录失败:', error);
    }
  };

  const handleDelete = async (record: Maintenance) => {
    if (!record.id) return;
    try {
      await maintenanceRepo.delete(record.id);
      setDeleteConfirm(null);
      await useArtworkStore.getState().loadMaintenances();
    } catch (error) {
      console.error('删除维护记录失败:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-7 h-7 text-primary-600" />
            维护记录
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            跟踪所有作品的修缮维护记录，统计维护成本
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
            新增维护
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <List className="w-4 h-4" />
            维护总次数
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <DollarSign className="w-4 h-4" />
            累计维护费用
          </div>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {formatCurrency(stats.totalCost)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Wrench className="w-4 h-4" />
            平均单次费用
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(stats.total > 0 ? stats.totalCost / stats.total : 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Calendar className="w-4 h-4" />
            本月维护
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {maintenances.filter(m => {
              const now = new Date();
              const d = new Date(m.date);
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">维护费用最高的作品 TOP 5</h3>
        <div className="flex flex-wrap gap-3">
          {stats.topCostArtworks.map(({ artworkId, cost }, idx) => (
            <div
              key={artworkId}
              className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg cursor-pointer hover:text-primary-600"
              onClick={() => artworkId && navigate(`/artwork/${artworkId}`)}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                idx === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                idx === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300' :
                idx === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
              )}>
                {idx + 1}
              </span>
              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">{getArtworkName(artworkId)}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{formatCurrency(cost)}</p>
              </div>
            </div>
          ))}
          {stats.topCostArtworks.length === 0 && (
            <p className="text-sm text-gray-400">暂无数据</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="搜索作品名称、施工单位、描述..."
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
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">维护类型</label>
              <div className="flex flex-wrap gap-1.5">
                {MAINTENANCE_TYPE_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(filterType === t ? null : t)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
                      filterType === t
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {t}
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

      {filteredMaintenances.length === 0 ? (
        <Empty
          title="暂无维护记录"
          description="没有找到符合条件的维护记录"
          action={
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowFormModal(true)}>
              新增维护
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
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">类型</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">施工单位</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">费用</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">日期</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">区域</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">状态</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaintenances.map(record => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  >
                    <td className="py-3 px-4">
                      <p
                        className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-primary-600"
                        onClick={() => record.artworkId && navigate(`/artwork/${record.artworkId}`)}
                      >
                        {getArtworkName(record.artworkId)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Tag color="blue">{record.workType}</Tag>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                        <Building2 className="w-3.5 h-3.5" />
                        {record.contractor}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {formatCurrency(record.cost)}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(record.date)}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(record.date)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {getArtworkDistrict(record.artworkId)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {record.completed ? (
                        <Tag color="green">已完成</Tag>
                      ) : (
                        <Tag color="amber">进行中</Tag>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => setSelectedRecord(record)}
                          title="查看详情"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => setDeleteConfirm(record)}
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
              <Wrench className="w-5 h-5 text-primary-600" />
              <span>新增维护记录</span>
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
                label="维护日期"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
              <Select
                label="维护类型"
                value={formData.workType}
                onChange={(e) => setFormData(prev => ({ ...prev, workType: e.target.value }))}
                options={MAINTENANCE_TYPE_OPTIONS.map(t => ({ value: t, label: t }))}
              />
              <Input
                label="施工单位"
                placeholder="请输入施工单位名称"
                value={formData.contractor}
                onChange={(e) => setFormData(prev => ({ ...prev, contractor: e.target.value }))}
                leftIcon={<Building2 className="w-4 h-4" />}
              />
              <Input
                label="费用（元）"
                type="number"
                placeholder="请输入维护费用"
                value={formData.cost || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
                leftIcon={<DollarSign className="w-4 h-4" />}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">完成状态</label>
                <div className="flex items-center gap-4 h-10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={formData.completed}
                      onChange={() => setFormData(prev => ({ ...prev, completed: true }))}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <Check className="w-4 h-4" /> 已完成
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!formData.completed}
                      onChange={() => setFormData(prev => ({ ...prev, completed: false }))}
                      className="w-4 h-4 text-primary-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                      <Clock className="w-4 h-4" /> 进行中
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <Textarea
              label="维护说明"
              placeholder="请输入维护内容说明..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
        </Modal>
      )}

      {selectedRecord && (
        <Modal
          open={true}
          onClose={() => setSelectedRecord(null)}
          width="lg"
          title={
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary-600" />
              <span>维护记录详情</span>
            </div>
          }
          footer={
            <Button variant="ghost" onClick={() => setSelectedRecord(null)}>关闭</Button>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">作品名称</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getArtworkName(selectedRecord.artworkId)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">维护类型</p>
                <Tag color="blue">{selectedRecord.workType}</Tag>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">施工单位</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedRecord.contractor}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">维护费用</p>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {formatCurrency(selectedRecord.cost)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">维护日期</p>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(selectedRecord.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">完成状态</p>
                {selectedRecord.completed ? (
                  <Tag color="green">已完成</Tag>
                ) : (
                  <Tag color="amber">进行中</Tag>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">维护说明</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {selectedRecord.description || '无'}
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
            确定要删除这条维护记录吗？此操作不可撤销。
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
