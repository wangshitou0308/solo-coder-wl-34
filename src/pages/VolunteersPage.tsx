import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  ClipboardCheck,
  Trash2,
  Edit,
  Trophy,
  Star,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import {
  VOLUNTEER_LEVEL_OPTIONS,
  VOLUNTEER_LEVEL_REQUIREMENTS,
} from '@/utils/constants';
import { Volunteer } from '../../db';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';
import { volunteerRepo } from '../../db';

export default function VolunteersPage() {
  const { initialize, volunteers, inspections, loading } = useArtworkStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Volunteer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});

  useEffect(() => {
    initialize();
  }, [initialize]);

  const getVolunteerLevel = (count: number): string => {
    if (count >= VOLUNTEER_LEVEL_REQUIREMENTS['专家']) return '专家';
    if (count >= VOLUNTEER_LEVEL_REQUIREMENTS['高级']) return '高级';
    if (count >= VOLUNTEER_LEVEL_REQUIREMENTS['中级']) return '中级';
    return '初级';
  };

  const getVolunteerLevelColor = (level: string): 'gray' | 'green' | 'blue' | 'purple' | 'amber' => {
    switch (level) {
      case '专家': return 'purple';
      case '高级': return 'blue';
      case '中级': return 'green';
      case '初级': return 'gray';
      default: return 'gray';
    }
  };

  const filteredVolunteers = useMemo(() => {
    let result = [...volunteers];
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(v =>
        v.name.toLowerCase().includes(kw) ||
        v.phone.toLowerCase().includes(kw) ||
        v.email.toLowerCase().includes(kw)
      );
    }
    return result.sort((a, b) => b.inspectionCount - a.inspectionCount);
  }, [volunteers, searchKeyword]);

  const getInspectionCount = (volunteerName: string): number => {
    return inspections.filter(i => i.volunteer === volunteerName).length;
  };

  const stats = useMemo(() => {
    const total = volunteers.length;
    const totalInspections = volunteers.reduce((sum, v) => sum + v.inspectionCount, 0);
    const avgInspections = total > 0 ? Math.round(totalInspections / total) : 0;
    const levelCounts: Record<string, number> = {};
    volunteers.forEach(v => {
      const level = getVolunteerLevel(v.inspectionCount);
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    return { total, totalInspections, avgInspections, levelCounts };
  }, [volunteers]);

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.name.trim()) errors.name = '请输入姓名';
    if (!formData.phone.trim()) errors.phone = '请输入电话';
    if (!formData.email.trim()) errors.email = '请输入邮箱';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setFormData({ name: '', phone: '', email: '' });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleOpenEdit = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setFormData({
      name: volunteer.name,
      phone: volunteer.phone,
      email: volunteer.email,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingVolunteer && editingVolunteer.id) {
        await volunteerRepo.update(editingVolunteer.id, formData);
      } else {
        await volunteerRepo.create({
          ...formData,
          inspectionCount: 0,
          joinDate: new Date().toISOString(),
        });
      }
      setShowFormModal(false);
      await useArtworkStore.getState().loadVolunteers();
    } catch (error) {
      console.error('保存志愿者失败:', error);
    }
  };

  const handleDelete = async (volunteer: Volunteer) => {
    if (!volunteer.id) return;
    try {
      await volunteerRepo.delete(volunteer.id);
      setDeleteConfirm(null);
      await useArtworkStore.getState().loadVolunteers();
    } catch (error) {
      console.error('删除志愿者失败:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-primary-600" />
            志愿者管理
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            管理巡查志愿者信息，统计贡献排行
          </p>
        </div>
        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={handleOpenAdd}
        >
          新增志愿者
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Users className="w-4 h-4" />
            注册志愿者
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <ClipboardCheck className="w-4 h-4" />
            累计巡查次数
          </div>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {stats.totalInspections}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Star className="w-4 h-4" />
            人均巡查次数
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgInspections}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Trophy className="w-4 h-4" />
            专家级志愿者
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.levelCounts['专家'] || 0}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <Input
          placeholder="搜索志愿者姓名、电话、邮箱..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          className="h-9 max-w-md"
        />
      </div>

      {filteredVolunteers.length === 0 ? (
        <Empty
          title="暂无志愿者"
          description="还没有注册志愿者，请添加第一位志愿者"
          action={
            <Button size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
              新增志愿者
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVolunteers.map((volunteer, index) => {
            const level = getVolunteerLevel(volunteer.inspectionCount);
            const recentInspections = getInspectionCount(volunteer.name);
            return (
              <div
                key={volunteer.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {volunteer.name}
                        </h3>
                        {index < 3 && (
                          <span className={cn(
                            'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                            index === 1 ? 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300' :
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          )}>
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <Tag color={getVolunteerLevelColor(level)}>{level}志愿者</Tag>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => handleOpenEdit(volunteer)}
                      title="编辑"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setDeleteConfirm(volunteer)}
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {volunteer.phone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {volunteer.email}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    加入于 {formatDate(volunteer.joinDate)}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">累计巡查</p>
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        {volunteer.inspectionCount} 次
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">系统内巡查记录</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {recentInspections} 次
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showFormModal && (
        <Modal
          open={true}
          onClose={() => setShowFormModal(false)}
          width="md"
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              <span>{editingVolunteer ? '编辑志愿者' : '新增志愿者'}</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setShowFormModal(false)}>取消</Button>
              <Button onClick={handleSubmit}>{editingVolunteer ? '保存修改' : '添加志愿者'}</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="姓名"
              placeholder="请输入志愿者姓名"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={formErrors.name}
              leftIcon={<Users className="w-4 h-4" />}
            />
            <Input
              label="联系电话"
              placeholder="请输入联系电话"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              error={formErrors.phone}
              leftIcon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="电子邮箱"
              type="email"
              placeholder="请输入电子邮箱"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={formErrors.email}
              leftIcon={<Mail className="w-4 h-4" />}
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
            确定要删除志愿者 <span className="font-semibold text-gray-900 dark:text-white">「{deleteConfirm.name}」</span> 吗？此操作不可撤销。
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
