import { useEffect, useState, useMemo } from 'react';
import {
  Send,
  CheckCircle,
  XCircle,
  Heart,
  Trophy,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Plus,
  Trash2,
  Eye,
  Filter,
  Image,
  Calendar,
  Eye as EyeIcon,
  MessageCircle,
  Camera,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import {
  SubmissionStatus,
  FeedbackStatus,
  FeedbackType,
  ArtworkType,
  InspectionStatus,
  Submission,
  Feedback,
} from '@/types';
import {
  SUBMISSION_STATUS_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  ARTWORK_TYPE_OPTIONS,
  DISTRICT_OPTIONS,
  TYPE_COLORS,
  STATUS_COLORS,
} from '@/utils/constants';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Select from '@/components/common/Select';
import Tag from '@/components/common/Tag';
import Empty from '@/components/common/Empty';
import Modal from '@/components/common/Modal';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';

type CommunityTab = 'submit' | 'review' | 'favorites' | 'hotrank' | 'feedback';

const TAB_ITEMS: { key: CommunityTab; label: string; icon: React.ReactNode }[] = [
  { key: 'submit', label: '居民投稿', icon: <Send className="w-4 h-4" /> },
  { key: 'review', label: '投稿审核', icon: <CheckCircle className="w-4 h-4" /> },
  { key: 'favorites', label: '我的收藏', icon: <Heart className="w-4 h-4" /> },
  { key: 'hotrank', label: '热门互动榜', icon: <Trophy className="w-4 h-4" /> },
  { key: 'feedback', label: '纠错反馈', icon: <AlertTriangle className="w-4 h-4" /> },
];

const DEFAULT_CURRENT_USER = '匿名居民';

interface SubmissionFormData {
  name: string;
  type: ArtworkType;
  district: string;
  address: string;
  lat: number;
  lng: number;
  description: string;
  photos: string[];
  author: string;
  contact: string;
}

interface FeedbackFormData {
  artworkId: number | null;
  type: FeedbackType;
  description: string;
  photos: string[];
  reporter: string;
  contact: string;
}

const emptySubmissionForm: SubmissionFormData = {
  name: '',
  type: ArtworkType.SCULPTURE,
  district: DISTRICT_OPTIONS[0],
  address: '',
  lat: 39.9042,
  lng: 116.4074,
  description: '',
  photos: [],
  author: DEFAULT_CURRENT_USER,
  contact: '',
};

const emptyFeedbackForm: FeedbackFormData = {
  artworkId: null,
  type: FeedbackType.INFO,
  description: '',
  photos: [],
  reporter: DEFAULT_CURRENT_USER,
  contact: '',
};

export default function CommunityPage() {
  const {
    initialize,
    submissions,
    feedbacks,
    artworks,
    loading,
    addSubmission,
    approveSubmission,
    rejectSubmission,
    deleteSubmission,
    toggleFavorite,
    getFavoriteArtworks,
    getHotArtworks,
    addFeedback,
    processFeedback,
    resolveFeedback,
    rejectFeedback,
    incrementViewCount,
  } = useArtworkStore();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<CommunityTab>('submit');

  const [submissionForm, setSubmissionForm] = useState<SubmissionFormData>(emptySubmissionForm);
  const [submissionErrors, setSubmissionErrors] = useState<Partial<Record<keyof SubmissionFormData, string>>>({});

  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showSubmissionDetail, setShowSubmissionDetail] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [deleteSubmissionConfirm, setDeleteSubmissionConfirm] = useState<Submission | null>(null);

  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>(emptyFeedbackForm);
  const [feedbackErrors, setFeedbackErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({});
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [showFeedbackHandleModal, setShowFeedbackHandleModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [handleNote, setHandleNote] = useState('');
  const [handleAction, setHandleAction] = useState<'resolve' | 'reject' | 'process'>('process');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const mySubmissions = useMemo(() => {
    return submissions.filter(s => s.author === submissionForm.author || s.author === DEFAULT_CURRENT_USER);
  }, [submissions, submissionForm.author]);

  const filteredSubmissions = useMemo(() => {
    if (reviewFilter === 'all') return submissions;
    return submissions.filter(s => s.status === reviewFilter);
  }, [submissions, reviewFilter]);

  const favoriteArtworks = useMemo(() => getFavoriteArtworks(), [getFavoriteArtworks]);

  const hotArtworks = useMemo(() => getHotArtworks(20), [getHotArtworks]);

  const myFeedbacks = useMemo(() => {
    return feedbacks.filter(f => f.reporter === feedbackForm.reporter || f.reporter === DEFAULT_CURRENT_USER);
  }, [feedbacks, feedbackForm.reporter]);

  const displayedFeedbacks = useMemo(() => {
    return isAdminMode ? feedbacks : myFeedbacks;
  }, [isAdminMode, feedbacks, myFeedbacks]);

  const getSubmissionStatusTagColor = (status: string): 'amber' | 'green' | 'red' => {
    switch (status) {
      case SubmissionStatus.PENDING: return 'amber';
      case SubmissionStatus.APPROVED: return 'green';
      case SubmissionStatus.REJECTED: return 'red';
      default: return 'amber';
    }
  };

  const getFeedbackStatusTagColor = (status: string): 'amber' | 'blue' | 'green' | 'red' => {
    switch (status) {
      case FeedbackStatus.PENDING: return 'amber';
      case FeedbackStatus.PROCESSING: return 'blue';
      case FeedbackStatus.RESOLVED: return 'green';
      case FeedbackStatus.REJECTED: return 'red';
      default: return 'amber';
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

  const validateSubmissionForm = (): boolean => {
    const errors: Partial<Record<keyof SubmissionFormData, string>> = {};
    if (!submissionForm.name.trim()) errors.name = '请输入作品名称';
    if (!submissionForm.address.trim()) errors.address = '请输入地址';
    if (!submissionForm.description.trim()) errors.description = '请输入作品描述';
    if (!submissionForm.lat || submissionForm.lat < -90 || submissionForm.lat > 90) errors.lat = '请输入有效纬度';
    if (!submissionForm.lng || submissionForm.lng < -180 || submissionForm.lng > 180) errors.lng = '请输入有效经度';
    if (!submissionForm.author.trim()) errors.author = '请输入投稿人姓名';
    if (!submissionForm.contact.trim()) errors.contact = '请输入联系方式';
    setSubmissionErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitSubmission = async () => {
    if (!validateSubmissionForm()) return;
    try {
      await addSubmission({
        name: submissionForm.name,
        type: submissionForm.type,
        district: submissionForm.district,
        address: submissionForm.address,
        lat: Number(submissionForm.lat),
        lng: Number(submissionForm.lng),
        description: submissionForm.description,
        photos: submissionForm.photos,
        author: submissionForm.author,
        contact: submissionForm.contact,
      });
      setSubmissionForm(emptySubmissionForm);
      setSubmissionErrors({});
    } catch (error) {
      console.error('提交投稿失败:', error);
    }
  };

  const handleApproveSubmission = async (submission: Submission) => {
    if (!submission.id) return;
    try {
      await approveSubmission(submission.id, '管理员');
    } catch (error) {
      console.error('审核通过失败:', error);
    }
  };

  const handleOpenRejectModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const handleRejectSubmission = async () => {
    if (!selectedSubmission?.id) return;
    if (!rejectNote.trim()) return;
    try {
      await rejectSubmission(selectedSubmission.id, '管理员', rejectNote);
      setShowRejectModal(false);
      setSelectedSubmission(null);
      setRejectNote('');
    } catch (error) {
      console.error('审核拒绝失败:', error);
    }
  };

  const handleDeleteSubmission = async (submission: Submission) => {
    if (!submission.id) return;
    try {
      await deleteSubmission(submission.id);
      setDeleteSubmissionConfirm(null);
    } catch (error) {
      console.error('删除投稿失败:', error);
    }
  };

  const handleViewSubmissionDetail = (submission: Submission) => {
    setSelectedSubmission(submission);
    setShowSubmissionDetail(true);
  };

  const handleToggleFavorite = async (artworkId: number) => {
    try {
      await toggleFavorite(artworkId);
    } catch (error) {
      console.error('操作收藏失败:', error);
    }
  };

  const handleViewArtworkDetail = (artworkId: number) => {
    incrementViewCount(artworkId);
    navigate(`/artworks/${artworkId}`);
  };

  const validateFeedbackForm = (): boolean => {
    const errors: Partial<Record<keyof FeedbackFormData, string>> = {};
    if (!feedbackForm.artworkId) errors.artworkId = '请选择作品';
    if (!feedbackForm.description.trim()) errors.description = '请输入反馈描述';
    if (!feedbackForm.reporter.trim()) errors.reporter = '请输入举报人姓名';
    if (!feedbackForm.contact.trim()) errors.contact = '请输入联系方式';
    setFeedbackErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitFeedback = async () => {
    if (!validateFeedbackForm()) return;
    if (!feedbackForm.artworkId) return;
    try {
      await addFeedback({
        artworkId: feedbackForm.artworkId,
        type: feedbackForm.type,
        description: feedbackForm.description,
        photos: feedbackForm.photos,
        reporter: feedbackForm.reporter,
        contact: feedbackForm.contact,
      });
      setFeedbackForm(emptyFeedbackForm);
      setFeedbackErrors({});
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };

  const handleOpenFeedbackHandle = (feedback: Feedback, action: 'resolve' | 'reject' | 'process') => {
    setSelectedFeedback(feedback);
    setHandleAction(action);
    setHandleNote('');
    setShowFeedbackHandleModal(true);
  };

  const handleFeedbackAction = async () => {
    if (!selectedFeedback?.id) return;
    try {
      if (handleAction === 'process') {
        await processFeedback(selectedFeedback.id, '管理员');
      } else if (handleAction === 'resolve') {
        if (!handleNote.trim()) return;
        await resolveFeedback(selectedFeedback.id, '管理员', handleNote);
      } else if (handleAction === 'reject') {
        if (!handleNote.trim()) return;
        await rejectFeedback(selectedFeedback.id, '管理员', handleNote);
      }
      setShowFeedbackHandleModal(false);
      setSelectedFeedback(null);
      setHandleNote('');
    } catch (error) {
      console.error('处理反馈失败:', error);
    }
  };

  const renderProgressBar = (label: string, value: number, maxValue: number, color: string) => {
    const percentage = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">{label}</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{value}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-primary-600" />
          社区互动
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          居民投稿、审核、收藏、热门榜与纠错反馈
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5">
        <div className="flex flex-wrap gap-1">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'submit' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600" />
              提交新投稿
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="作品名称"
                  placeholder="请输入作品名称"
                  value={submissionForm.name}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, name: e.target.value }))}
                  error={submissionErrors.name}
                />
                <Select
                  label="作品类型"
                  value={submissionForm.type}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, type: e.target.value as ArtworkType }))}
                  options={ARTWORK_TYPE_OPTIONS.map(t => ({ value: t, label: t }))}
                />
                <Select
                  label="所在区域"
                  value={submissionForm.district}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, district: e.target.value }))}
                  options={DISTRICT_OPTIONS.map(d => ({ value: d, label: d }))}
                />
                <Input
                  label="详细地址"
                  placeholder="请输入详细地址"
                  value={submissionForm.address}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, address: e.target.value }))}
                  error={submissionErrors.address}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />
                <Input
                  label="纬度"
                  type="number"
                  step="0.0001"
                  placeholder="例如 39.9042"
                  value={submissionForm.lat}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, lat: Number(e.target.value) }))}
                  error={submissionErrors.lat}
                />
                <Input
                  label="经度"
                  type="number"
                  step="0.0001"
                  placeholder="例如 116.4074"
                  value={submissionForm.lng}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, lng: Number(e.target.value) }))}
                  error={submissionErrors.lng}
                />
                <Input
                  label="投稿人姓名"
                  placeholder="请输入您的姓名"
                  value={submissionForm.author}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, author: e.target.value }))}
                  error={submissionErrors.author}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="联系方式"
                  placeholder="请输入手机号或邮箱"
                  value={submissionForm.contact}
                  onChange={(e) => setSubmissionForm(prev => ({ ...prev, contact: e.target.value }))}
                  error={submissionErrors.contact}
                />
              </div>
              <Textarea
                label="作品描述"
                placeholder="请详细描述作品的背景、特点等..."
                value={submissionForm.description}
                onChange={(e) => setSubmissionForm(prev => ({ ...prev, description: e.target.value }))}
                error={submissionErrors.description}
                rows={4}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  照片上传
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {submissionForm.photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                      <button
                        onClick={() => {
                          const newPhotos = [...submissionForm.photos];
                          newPhotos.splice(idx, 1);
                          setSubmissionForm(prev => ({ ...prev, photos: newPhotos }));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSubmissionForm(prev => ({
                      ...prev,
                      photos: [...prev.photos, `placeholder_${Date.now()}`]
                    }))}
                    className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">添加</span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  照片数量: {submissionForm.photos.length} (占位功能)
                </p>
              </div>
              <div className="pt-2">
                <Button
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleSubmitSubmission}
                  size="lg"
                >
                  提交投稿
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              我的投稿记录
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (共 {mySubmissions.length} 条)
              </span>
            </h2>
            {mySubmissions.length === 0 ? (
              <Empty
                title="暂无投稿记录"
                description="还没有提交过投稿，快来分享您发现的公共艺术作品吧"
              />
            ) : (
              <div className="space-y-3">
                {mySubmissions.map(submission => (
                  <div
                    key={submission.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {submission.name}
                          </h3>
                          <Tag color={getTypeTagColor(submission.type)}>{submission.type}</Tag>
                          <Tag color={getSubmissionStatusTagColor(submission.status)}>
                            {SUBMISSION_STATUS_OPTIONS.find(o => o.value === submission.status)?.label || submission.status}
                          </Tag>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {submission.district} · {submission.address}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {submission.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(submission.submittedAt, 'YYYY-MM-DD HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Image className="w-3 h-3" />
                            {submission.photos?.length || 0}张照片
                          </span>
                        </div>
                        {submission.reviewNote && (
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-400">
                            审核备注: {submission.reviewNote}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">状态筛选:</span>
              {[{ value: 'all', label: '全部' }, ...SUBMISSION_STATUS_OPTIONS].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setReviewFilter(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                    reviewFilter === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                共 {filteredSubmissions.length} 条
              </span>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <Empty
              title="暂无投稿数据"
              description="当前筛选条件下没有投稿记录"
            />
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map(submission => (
                <div
                  key={submission.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {submission.name}
                        </h3>
                        <Tag color={getTypeTagColor(submission.type)}>{submission.type}</Tag>
                        <Tag color={getSubmissionStatusTagColor(submission.status)}>
                          {SUBMISSION_STATUS_OPTIONS.find(o => o.value === submission.status)?.label || submission.status}
                        </Tag>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {submission.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(submission.submittedAt, 'YYYY-MM-DD HH:mm')}
                        </span>
                        <span className="flex items-center gap-1 col-span-2">
                          <MapPin className="w-3 h-3" />
                          {submission.district} · {submission.address}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleViewSubmissionDetail(submission)}
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {submission.status === SubmissionStatus.PENDING && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => handleApproveSubmission(submission)}
                            title="通过"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            onClick={() => handleOpenRejectModal(submission)}
                            title="拒绝"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => setDeleteSubmissionConfirm(submission)}
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'favorites' && (
        <div>
          {favoriteArtworks.length === 0 ? (
            <Empty
              title="暂无收藏"
              description="还没有收藏任何作品，去发现喜欢的公共艺术吧"
              icon={<Heart className="w-10 h-10 text-gray-400" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {favoriteArtworks.map(artwork => (
                <div
                  key={artwork.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => artwork.id && handleViewArtworkDetail(artwork.id)}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        artwork.id && handleToggleFavorite(artwork.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1">
                      <span className="px-2 py-0.5 text-xs bg-black/50 text-white rounded-full flex items-center gap-1">
                        <EyeIcon className="w-3 h-3" />
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
                        {artwork.artist} · {artwork.year}年
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{artwork.district} · {artwork.address}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'hotrank' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              热门互动榜 Top 20
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              综合得分 = 浏览量×1 + 评论数×5 + 收藏数×3 + 照片数×2
            </p>
          </div>
          {hotArtworks.length === 0 ? (
            <Empty
              title="暂无数据"
              description="热门榜单数据为空"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {hotArtworks.map((item, index) => {
                const maxScore = hotArtworks[0]?.score || 1;
                const maxViews = Math.max(...hotArtworks.map(i => i.viewCount), 1);
                const maxComments = Math.max(...hotArtworks.map(i => i.commentCount), 1);
                const maxFavorites = Math.max(...hotArtworks.map(i => i.favoriteCount), 1);
                const maxPhotos = Math.max(...hotArtworks.map(i => i.photoCount), 1);
                return (
                  <div
                    key={item.artwork.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => item.artwork.id && handleViewArtworkDetail(item.artwork.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0',
                        index === 0 && 'bg-amber-500 text-white',
                        index === 1 && 'bg-gray-400 text-white',
                        index === 2 && 'bg-amber-700 text-white',
                        index > 2 && 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {item.artwork.name}
                          </h3>
                          <Tag color={getTypeTagColor(item.artwork.type)}>{item.artwork.type}</Tag>
                          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 ml-auto">
                            综合得分: {item.score}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {renderProgressBar('浏览量', item.viewCount, maxViews, '#0ea5e9')}
                          {renderProgressBar('评论数', item.commentCount, maxComments, '#8b5cf6')}
                          {renderProgressBar('收藏数', item.favoriteCount, maxFavorites, '#ef4444')}
                          {renderProgressBar('照片数', item.photoCount, maxPhotos, '#22c55e')}
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.artwork.artist}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {item.artwork.district}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                提交纠错反馈
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">管理员模式</span>
                <button
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    isAdminMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
                    isAdminMode ? 'translate-x-5' : 'translate-x-0.5'
                  )} />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="选择作品"
                  value={feedbackForm.artworkId?.toString() || ''}
                  onChange={(e) => setFeedbackForm(prev => ({
                    ...prev,
                    artworkId: e.target.value ? Number(e.target.value) : null
                  }))}
                  options={artworks.map(a => ({ value: a.id!.toString(), label: a.name }))}
                  placeholder="请选择要反馈的作品"
                  error={feedbackErrors.artworkId}
                />
                <Select
                  label="反馈类型"
                  value={feedbackForm.type}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, type: e.target.value as FeedbackType }))}
                  options={FEEDBACK_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
                />
                <Input
                  label="举报人姓名"
                  placeholder="请输入您的姓名"
                  value={feedbackForm.reporter}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, reporter: e.target.value }))}
                  error={feedbackErrors.reporter}
                  leftIcon={<User className="w-4 h-4" />}
                />
                <Input
                  label="联系方式"
                  placeholder="请输入手机号或邮箱"
                  value={feedbackForm.contact}
                  onChange={(e) => setFeedbackForm(prev => ({ ...prev, contact: e.target.value }))}
                  error={feedbackErrors.contact}
                />
              </div>
              <Textarea
                label="问题描述"
                placeholder="请详细描述发现的问题..."
                value={feedbackForm.description}
                onChange={(e) => setFeedbackForm(prev => ({ ...prev, description: e.target.value }))}
                error={feedbackErrors.description}
                rows={4}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  问题照片
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {feedbackForm.photos.map((photo, idx) => (
                    <div key={idx} className="relative">
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                      <button
                        onClick={() => {
                          const newPhotos = [...feedbackForm.photos];
                          newPhotos.splice(idx, 1);
                          setFeedbackForm(prev => ({ ...prev, photos: newPhotos }));
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setFeedbackForm(prev => ({
                      ...prev,
                      photos: [...prev.photos, `placeholder_${Date.now()}`]
                    }))}
                    className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">添加</span>
                  </button>
                </div>
              </div>
              <div className="pt-2">
                <Button
                  leftIcon={<Send className="w-4 h-4" />}
                  onClick={handleSubmitFeedback}
                  size="lg"
                >
                  提交反馈
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-600" />
              {isAdminMode ? '所有反馈' : '我的反馈记录'}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                (共 {displayedFeedbacks.length} 条)
              </span>
            </h2>
            {displayedFeedbacks.length === 0 ? (
              <Empty
                title="暂无反馈记录"
                description={isAdminMode ? "还没有用户提交反馈" : "还没有提交过反馈"}
              />
            ) : (
              <div className="space-y-3">
                {displayedFeedbacks.map(feedback => {
                  const artwork = artworks.find(a => a.id === feedback.artworkId);
                  const typeInfo = FEEDBACK_TYPE_OPTIONS.find(o => o.value === feedback.type);
                  return (
                    <div
                      key={feedback.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {artwork?.name || `作品#${feedback.artworkId}`}
                            </h3>
                            <Tag color="purple">{typeInfo?.label || feedback.type}</Tag>
                            <Tag color={getFeedbackStatusTagColor(feedback.status)}>
                              {FEEDBACK_STATUS_OPTIONS.find(o => o.value === feedback.status)?.label || feedback.status}
                            </Tag>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {feedback.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {feedback.reporter}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(feedback.submittedAt, 'YYYY-MM-DD HH:mm')}
                            </span>
                            {(feedback.photos?.length || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Image className="w-3 h-3" />
                                {feedback.photos.length}张
                              </span>
                            )}
                          </div>
                          {feedback.handleNote && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-400">
                              处理备注: {feedback.handleNote}
                            </div>
                          )}
                        </div>
                        {isAdminMode && feedback.status !== FeedbackStatus.RESOLVED && feedback.status !== FeedbackStatus.REJECTED && (
                          <div className="flex flex-col gap-1 shrink-0">
                            {feedback.status === FeedbackStatus.PENDING && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={() => handleOpenFeedbackHandle(feedback, 'process')}
                              >
                                标记处理中
                              </Button>
                            )}
                            {feedback.status === FeedbackStatus.PROCESSING && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => handleOpenFeedbackHandle(feedback, 'resolve')}
                              >
                                标记已解决
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleOpenFeedbackHandle(feedback, 'reject')}
                            >
                              拒绝
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {showSubmissionDetail && selectedSubmission && (
        <Modal
          open={true}
          onClose={() => {
            setShowSubmissionDetail(false);
            setSelectedSubmission(null);
          }}
          width="lg"
          title={
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary-600" />
              <span>投稿详情</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => {
                setShowSubmissionDetail(false);
                setSelectedSubmission(null);
              }}>
                关闭
              </Button>
              {selectedSubmission.status === SubmissionStatus.PENDING && (
                <>
                  <Button
                    variant="danger"
                    leftIcon={<XCircle className="w-4 h-4" />}
                    onClick={() => {
                      setShowSubmissionDetail(false);
                      handleOpenRejectModal(selectedSubmission);
                    }}
                  >
                    拒绝
                  </Button>
                  <Button
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                    onClick={() => {
                      handleApproveSubmission(selectedSubmission);
                      setShowSubmissionDetail(false);
                      setSelectedSubmission(null);
                    }}
                  >
                    通过
                  </Button>
                </>
              )}
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">作品名称</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.name}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">作品类型</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.type}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">所在区域</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.district}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">详细地址</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.address}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">纬度</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.lat}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">经度</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.lng}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">投稿人</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.author}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">联系方式</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">{selectedSubmission.contact}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">提交时间</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                  {formatDate(selectedSubmission.submittedAt, 'YYYY-MM-DD HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">审核状态</label>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
                  {SUBMISSION_STATUS_OPTIONS.find(o => o.value === selectedSubmission.status)?.label || selectedSubmission.status}
                </p>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400">作品描述</label>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">
                {selectedSubmission.description}
              </p>
            </div>
            {selectedSubmission.photos && selectedSubmission.photos.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                  照片 ({selectedSubmission.photos.length}张)
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {selectedSubmission.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                    >
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedSubmission.reviewNote && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <label className="text-xs text-amber-600 dark:text-amber-400 font-medium">审核备注</label>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
                  {selectedSubmission.reviewNote}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showRejectModal && selectedSubmission && (
        <Modal
          open={true}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedSubmission(null);
            setRejectNote('');
          }}
          width="md"
          title={
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span>拒绝投稿</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => {
                setShowRejectModal(false);
                setSelectedSubmission(null);
                setRejectNote('');
              }}>
                取消
              </Button>
              <Button
                variant="danger"
                onClick={handleRejectSubmission}
                disabled={!rejectNote.trim()}
              >
                确认拒绝
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              确定要拒绝投稿 <span className="font-semibold text-gray-900 dark:text-white">「{selectedSubmission.name}」</span> 吗？
              请填写拒绝原因：
            </p>
            <Textarea
              placeholder="请输入拒绝原因..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              error={!rejectNote.trim() ? '请输入拒绝原因' : undefined}
            />
          </div>
        </Modal>
      )}

      {deleteSubmissionConfirm && (
        <Modal
          open={true}
          onClose={() => setDeleteSubmissionConfirm(null)}
          width="md"
          title={
            <div className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>确认删除</span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteSubmissionConfirm(null)}>取消</Button>
              <Button variant="danger" onClick={() => handleDeleteSubmission(deleteSubmissionConfirm)}>确认删除</Button>
            </>
          }
        >
          <p className="text-gray-600 dark:text-gray-300">
            确定要删除投稿 <span className="font-semibold text-gray-900 dark:text-white">「{deleteSubmissionConfirm.name}」</span> 吗？
            此操作不可撤销。
          </p>
        </Modal>
      )}

      {showFeedbackHandleModal && selectedFeedback && (
        <Modal
          open={true}
          onClose={() => {
            setShowFeedbackHandleModal(false);
            setSelectedFeedback(null);
            setHandleNote('');
          }}
          width="md"
          title={
            <div className="flex items-center gap-2 text-primary-600">
              <MessageCircle className="w-5 h-5" />
              <span>
                {handleAction === 'process' && '标记处理中'}
                {handleAction === 'resolve' && '标记已解决'}
                {handleAction === 'reject' && '拒绝反馈'}
              </span>
            </div>
          }
          footer={
            <>
              <Button variant="ghost" onClick={() => {
                setShowFeedbackHandleModal(false);
                setSelectedFeedback(null);
                setHandleNote('');
              }}>
                取消
              </Button>
              <Button
                variant={handleAction === 'reject' ? 'danger' : 'primary'}
                onClick={handleFeedbackAction}
                disabled={(handleAction === 'resolve' || handleAction === 'reject') && !handleNote.trim()}
              >
                确认
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            {handleAction !== 'process' && (
              <Textarea
                label={handleAction === 'resolve' ? '处理说明' : '拒绝原因'}
                placeholder={handleAction === 'resolve' ? '请输入处理说明...' : '请输入拒绝原因...'}
                value={handleNote}
                onChange={(e) => setHandleNote(e.target.value)}
                rows={4}
                error={!handleNote.trim() ? (handleAction === 'resolve' ? '请输入处理说明' : '请输入拒绝原因') : undefined}
              />
            )}
            {handleAction === 'process' && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                确定要将此反馈标记为"处理中"吗？
              </p>
            )}
          </div>
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
