import { useEffect, useState } from 'react';
import {
  X,
  Info,
  Camera,
  ClipboardCheck,
  Wrench,
  MessageSquare,
  Star,
  Eye,
  MapPin,
  User,
  Calendar,
  Layers,
  Building2,
  DollarSign,
  Clock,
  Heart,
  Plus,
} from 'lucide-react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Select from '@/components/common/Select';
import { useArtworkStore } from '@/store/useArtworkStore';
import { TYPE_COLORS, STATUS_COLORS, ARTWORK_TYPE_OPTIONS, INSPECTION_STATUS_OPTIONS, ISSUE_OPTIONS, MAINTENANCE_TYPE_OPTIONS } from '@/utils/constants';
import { ArtworkType, InspectionStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Inspection, Maintenance, Comment } from '../../db';

type TabType = 'info' | 'photos' | 'inspections' | 'maintenance' | 'comments';

interface ArtworkDetailModalProps {
  artworkId: number;
  onClose: () => void;
}

export default function ArtworkDetailModal({ artworkId, onClose }: ArtworkDetailModalProps) {
  const { selected, loadDetail, addInspection, addMaintenance, addComment, loading } = useArtworkStore();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);

  const [inspectionForm, setInspectionForm] = useState({
    status: InspectionStatus.GOOD,
    volunteer: '',
    issues: [] as string[],
    notes: '',
  });

  const [maintenanceForm, setMaintenanceForm] = useState({
    date: new Date().toISOString().split('T')[0],
    workType: MAINTENANCE_TYPE_OPTIONS[0],
    contractor: '',
    cost: 0,
    description: '',
  });

  const [commentForm, setCommentForm] = useState({
    author: '',
    rating: 5,
    content: '',
  });

  useEffect(() => {
    loadDetail(artworkId);
  }, [artworkId, loadDetail]);

  const artwork = selected?.artwork;

  const tabs = [
    { id: 'info', label: '作品档案', icon: Info },
    { id: 'photos', label: '照片展示', icon: Camera },
    { id: 'inspections', label: '巡查记录', icon: ClipboardCheck },
    { id: 'maintenance', label: '维护记录', icon: Wrench },
    { id: 'comments', label: '评论评分', icon: MessageSquare },
  ];

  const handleSubmitInspection = async () => {
    if (!artwork?.id) return;
    try {
      await addInspection({
        artworkId: artwork.id,
        date: new Date().toISOString(),
        status: inspectionForm.status,
        volunteer: inspectionForm.volunteer || '匿名巡查员',
        issues: inspectionForm.issues.join('、'),
        notes: inspectionForm.notes,
        photos: [],
      });
      setShowInspectionForm(false);
      setInspectionForm({
        status: InspectionStatus.GOOD,
        volunteer: '',
        issues: [],
        notes: '',
      });
    } catch (error) {
      console.error('提交巡查记录失败:', error);
    }
  };

  const handleSubmitMaintenance = async () => {
    if (!artwork?.id) return;
    try {
      await addMaintenance({
        artworkId: artwork.id,
        date: new Date(maintenanceForm.date).toISOString(),
        contractor: maintenanceForm.contractor,
        workType: maintenanceForm.workType,
        cost: maintenanceForm.cost,
        description: maintenanceForm.description,
        completed: false,
      });
      setShowMaintenanceForm(false);
      setMaintenanceForm({
        date: new Date().toISOString().split('T')[0],
        workType: MAINTENANCE_TYPE_OPTIONS[0],
        contractor: '',
        cost: 0,
        description: '',
      });
    } catch (error) {
      console.error('提交维护记录失败:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!artwork?.id) return;
    try {
      await addComment({
        artworkId: artwork.id,
        date: new Date().toISOString(),
        author: commentForm.author || '匿名用户',
        rating: commentForm.rating,
        content: commentForm.content,
        photos: [],
      });
      setShowCommentForm(false);
      setCommentForm({
        author: '',
        rating: 5,
        content: '',
      });
    } catch (error) {
      console.error('提交评论失败:', error);
    }
  };

  const toggleIssue = (issue: string) => {
    setInspectionForm(prev => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter(i => i !== issue)
        : [...prev.issues, issue],
    }));
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              sizeClass,
              star <= rating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 dark:text-gray-600'
            )}
          />
        ))}
      </div>
    );
  };

  if (!artwork) {
    return null;
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      width="full"
      className="max-h-[90vh]"
      title={
        <div className="flex items-center gap-3">
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{artwork.name}</h2>
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
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 mb-4 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'inspections' && selected?.inspections.length && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {selected.inspections.length}
                  </span>
                )}
                {tab.id === 'maintenance' && selected?.maintenances.length && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {selected.maintenances.length}
                  </span>
                )}
                {tab.id === 'comments' && selected?.comments.length && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {selected.comments.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">浏览次数</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{artwork.viewCount}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                    <ClipboardCheck className="w-4 h-4" />
                    <span className="text-sm">巡查次数</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{artwork.inspectionCount}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                    <Star className="w-4 h-4" />
                    <span className="text-sm">平均评分</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selected?.avgRating.toFixed(1) || '暂无'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-600" />
                    基本信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">作者</p>
                        <p className="text-sm text-gray-900 dark:text-white">{artwork.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">创作年份</p>
                        <p className="text-sm text-gray-900 dark:text-white">{artwork.year}年</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Layers className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">材质工艺</p>
                        <p className="text-sm text-gray-900 dark:text-white">{artwork.material}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">所在位置</p>
                        <p className="text-sm text-gray-900 dark:text-white">{artwork.district} · {artwork.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    产权与资金
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">产权归属</p>
                        <p className="text-sm text-gray-900 dark:text-white">{artwork.ownership || '暂无信息'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">资金来源</p>
                        <p className="text-sm text-gray-900 dark:text-white">{artwork.fundingSource || '暂无信息'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">累计维护费用</p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          ¥{selected?.totalCost.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Heart className="w-5 h-5 text-primary-600" />
                  作品描述
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {artwork.description}
                </p>
              </div>

              {artwork.story && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-primary-600" />
                    创作故事
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {artwork.story}
                  </p>
                </div>
              )}

              {artwork.publicFeedback && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                    <MessageSquare className="w-5 h-5 text-primary-600" />
                    公众评价
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {artwork.publicFeedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">官方照片</h3>
                {selected?.photos && selected.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selected.photos.map(photo => (
                      <div key={photo.id} className="group relative rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-gray-700">
                        <img
                          src={photo.url}
                          alt={photo.caption}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                          <p className="text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {photo.caption}
                          </p>
                        </div>
                        <span className="absolute top-2 left-2 px-2 py-0.5 text-xs bg-black/60 text-white rounded-full">
                          {photo.category}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无官方照片</p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  用户上传照片 ({selected?.userPhotos.length || 0})
                </h3>
                {selected?.userPhotos && selected.userPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selected.userPhotos.map(photo => (
                      <div key={photo.id} className="group relative rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700">
                        <img
                          src={photo.url}
                          alt={photo.description}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs truncate">{photo.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无用户上传照片</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  巡查历史记录 ({selected?.inspections.length || 0})
                </h3>
                <Button
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowInspectionForm(true)}
                >
                  新增巡查
                </Button>
              </div>

              {showInspectionForm && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">新增巡查记录</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="巡查状态"
                      value={inspectionForm.status}
                      onChange={(e) => setInspectionForm(prev => ({ ...prev, status: e.target.value as InspectionStatus }))}
                      options={INSPECTION_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                    />
                    <Input
                      label="巡查人员"
                      placeholder="请输入巡查人员姓名"
                      value={inspectionForm.volunteer}
                      onChange={(e) => setInspectionForm(prev => ({ ...prev, volunteer: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                      发现问题
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ISSUE_OPTIONS.map(issue => (
                        <button
                          key={issue}
                          onClick={() => toggleIssue(issue)}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                            inspectionForm.issues.includes(issue)
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
                    value={inspectionForm.notes}
                    onChange={(e) => setInspectionForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowInspectionForm(false)}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSubmitInspection}>
                      提交记录
                    </Button>
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600" />
                <div className="space-y-4">
                  {selected?.inspections.map((inspection: Inspection, index: number) => (
                    <div key={inspection.id} className="relative pl-10">
                      <div
                        className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                        style={{
                          backgroundColor: STATUS_COLORS[inspection.status as InspectionStatus] || '#6b7280',
                        }}
                      />
                      <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Tag
                              color={
                                inspection.status === InspectionStatus.GOOD ? 'green' :
                                inspection.status === InspectionStatus.MINOR ? 'teal' :
                                inspection.status === InspectionStatus.MODERATE ? 'amber' :
                                inspection.status === InspectionStatus.SEVERE ? 'red' : 'gray'
                              }
                            >
                              {inspection.status}
                            </Tag>
                            <span className="text-sm text-gray-900 dark:text-white font-medium">
                              {inspection.volunteer}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(inspection.date).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        {inspection.issues && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {inspection.issues.split('、').filter(Boolean).map((issue, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full"
                              >
                                {issue}
                              </span>
                            ))}
                          </div>
                        )}
                        {inspection.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">{inspection.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!selected?.inspections || selected.inspections.length === 0) && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                      暂无巡查记录
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  维护记录 ({selected?.maintenances.length || 0})
                </h3>
                <Button
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowMaintenanceForm(true)}
                >
                  新增维护
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">累计维护费用</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ¥{selected?.totalCost.toLocaleString() || '0'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  共 {selected?.maintenances.length || 0} 次维护
                </p>
              </div>

              {showMaintenanceForm && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">新增维护记录</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="维护日期"
                      type="date"
                      value={maintenanceForm.date}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                    <Select
                      label="维护类型"
                      value={maintenanceForm.workType}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, workType: e.target.value }))}
                      options={MAINTENANCE_TYPE_OPTIONS.map(t => ({ value: t, label: t }))}
                    />
                    <Input
                      label="施工单位"
                      placeholder="请输入施工单位名称"
                      value={maintenanceForm.contractor}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, contractor: e.target.value }))}
                    />
                    <Input
                      label="费用（元）"
                      type="number"
                      placeholder="请输入维护费用"
                      value={maintenanceForm.cost || ''}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: Number(e.target.value) }))}
                    />
                  </div>
                  <Textarea
                    label="维护说明"
                    placeholder="请输入维护内容说明..."
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowMaintenanceForm(false)}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSubmitMaintenance}>
                      提交记录
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {selected?.maintenances.map((maintenance: Maintenance) => (
                  <div
                    key={maintenance.id}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag color="blue">{maintenance.workType}</Tag>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {maintenance.contractor}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        ¥{maintenance.cost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(maintenance.date).toLocaleDateString('zh-CN')}
                    </div>
                    {maintenance.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300">{maintenance.description}</p>
                    )}
                  </div>
                ))}
                {(!selected?.maintenances || selected.maintenances.length === 0) && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                    暂无维护记录
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    用户评论 ({selected?.comments.length || 0})
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(selected?.avgRating || 0, 'sm')}
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      平均 {selected?.avgRating.toFixed(1) || '0.0'} 分
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowCommentForm(true)}
                >
                  发表评论
                </Button>
              </div>

              {showCommentForm && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">发表评论</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="您的昵称"
                      placeholder="请输入昵称"
                      value={commentForm.author}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, author: e.target.value }))}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                        评分
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setCommentForm(prev => ({ ...prev, rating: star }))}
                            className="p-1"
                          >
                            <Star
                              className={cn(
                                'w-6 h-6',
                                star <= commentForm.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Textarea
                    label="评论内容"
                    placeholder="请分享您对这件作品的看法..."
                    value={commentForm.content}
                    onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setShowCommentForm(false)}>
                      取消
                    </Button>
                    <Button size="sm" onClick={handleSubmitComment}>
                      提交评论
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {selected?.comments.map((comment: Comment) => (
                  <div
                    key={comment.id}
                    className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {comment.author}
                          </p>
                          <div className="flex items-center gap-2">
                            {renderStars(comment.rating, 'sm')}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.date).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                    {comment.photos && comment.photos.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {comment.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt="评论图片"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!selected?.comments || selected.comments.length === 0) && (
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                    暂无评论，来发表第一条评论吧！
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function BookOpen({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
