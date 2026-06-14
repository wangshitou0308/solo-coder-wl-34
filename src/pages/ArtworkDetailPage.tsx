import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  Heart,
  Share2,
  Copy,
  QrCode,
  ArrowLeft,
  Eye,
  ClipboardCheck,
  Wrench,
  MessageSquare,
  Camera,
  MapPin,
  User,
  Calendar,
  Layers,
  Building2,
  DollarSign,
  BookOpen,
  AlertCircle,
  Plus,
  ChevronRight,
  Clock,
  Image as ImageIcon,
} from 'lucide-react';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import Input from '@/components/common/Input';
import Textarea from '@/components/common/Textarea';
import Select from '@/components/common/Select';
import Empty from '@/components/common/Empty';
import { useArtworkStore } from '@/store/useArtworkStore';
import {
  PHOTO_CATEGORY_OPTIONS,
  TYPE_COLORS,
  STATUS_COLORS,
  ISSUE_OPTIONS,
  MAINTENANCE_TYPE_OPTIONS,
  INSPECTION_STATUS_OPTIONS,
  FEEDBACK_TYPE_OPTIONS,
  NEARBY_DISTANCE_KM,
} from '@/utils/constants';
import { PhotoCategory, InspectionStatus, ArtworkType, FeedbackType } from '@/types';
import { cn } from '@/lib/utils';
import { Inspection, Maintenance, Comment, Photo, UserPhoto } from '../../db';

const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
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

const getTypeTagColor = (
  type: string
): 'teal' | 'purple' | 'amber' | 'blue' | 'red' | 'green' | 'gray' => {
  switch (type as ArtworkType) {
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
      return 'gray';
  }
};

const getStatusTagColor = (
  status: string
): 'green' | 'teal' | 'amber' | 'red' | 'gray' => {
  switch (status as InspectionStatus) {
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

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selected,
    loadDetail,
    addInspection,
    addMaintenance,
    addComment,
    addUserPhoto,
    toggleFavorite,
    getNearbyArtworks,
    addFeedback,
    incrementViewCount,
    loading,
  } = useArtworkStore();

  const [activePhotoTab, setActivePhotoTab] = useState<PhotoCategory>(
    PhotoCategory.PANORAMA
  );
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const [photoForm, setPhotoForm] = useState({
    author: '',
    url: '',
    description: '',
  });

  const [feedbackForm, setFeedbackForm] = useState({
    type: FeedbackType.OTHER,
    reporter: '',
    contact: '',
    description: '',
  });

  const artworkId = Number(id);

  useEffect(() => {
    if (artworkId) {
      loadDetail(artworkId);
      incrementViewCount(artworkId);
    }
  }, [artworkId, loadDetail, incrementViewCount]);

  const artwork = selected?.artwork;
  const nearbyArtworks = useMemo(
    () => (artworkId ? getNearbyArtworks(artworkId, NEARBY_DISTANCE_KM) : []),
    [artworkId, getNearbyArtworks, selected]
  );

  const filteredPhotos = useMemo(() => {
    if (!selected?.photos) return [] as Photo[];
    if (activePhotoTab === PhotoCategory.USER_UPLOAD) {
      return [] as Photo[];
    }
    return selected.photos.filter((p) => p.category === activePhotoTab);
  }, [selected?.photos, activePhotoTab]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share && artwork) {
      try {
        await navigator.share({
          title: artwork.name,
          text: artwork.description,
          url: window.location.href,
        });
      } catch (e) {
        console.log('分享取消');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleToggleFavorite = async () => {
    if (artworkId) {
      await toggleFavorite(artworkId);
    }
  };

  const toggleIssue = (issue: string) => {
    setInspectionForm((prev) => ({
      ...prev,
      issues: prev.issues.includes(issue)
        ? prev.issues.filter((i) => i !== issue)
        : [...prev.issues, issue],
    }));
  };

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

  const handleSubmitPhoto = async () => {
    if (!artwork?.id || !photoForm.url) return;
    try {
      await addUserPhoto({
        artworkId: artwork.id,
        date: new Date().toISOString(),
        url: photoForm.url,
        author: photoForm.author || '匿名用户',
        description: photoForm.description,
      });
      setShowPhotoForm(false);
      setPhotoForm({
        author: '',
        url: '',
        description: '',
      });
    } catch (error) {
      console.error('上传照片失败:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!artwork?.id) return;
    try {
      await addFeedback({
        artworkId: artwork.id,
        type: feedbackForm.type,
        description: feedbackForm.description,
        photos: [],
        reporter: feedbackForm.reporter || '匿名用户',
        contact: feedbackForm.contact,
      });
      setShowFeedbackForm(false);
      setFeedbackForm({
        type: FeedbackType.OTHER,
        reporter: '',
        contact: '',
        description: '',
      });
    } catch (error) {
      console.error('提交反馈失败:', error);
    }
  };

  if (loading && !artwork) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300">加载中...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="py-16">
        <Empty
          title="作品不存在"
          description="您访问的作品可能已被删除或不存在"
          action={
            <Button leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate(-1)}>
              返回上一页
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 className="w-4 h-4" />}
            onClick={handleShare}
          >
            分享
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={copied ? <Copy className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopyLink}
          >
            {copied ? '已复制' : '复制链接'}
          </Button>
          <Button
            variant={selected?.isFavorited ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={
              <Heart
                className={cn(
                  'w-4 h-4',
                  selected?.isFavorited && 'fill-current'
                )}
              />
            }
            onClick={handleToggleFavorite}
          >
            {selected?.isFavorited ? '已收藏' : '收藏'}
          </Button>
        </div>
      </div>

      {/* 顶部档案总览区 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Tag color={getTypeTagColor(artwork.type)}>{artwork.type}</Tag>
                <Tag color={getStatusTagColor(artwork.statusLatest)}>
                  {artwork.statusLatest}
                </Tag>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {artwork.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {artwork.description}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="w-24 h-24 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center">
                <QrCode className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">二维码</span>
              </div>
            </div>
          </div>

          {/* 统计数据卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400 mb-1">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs">累计浏览</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {artwork.viewCount}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                <Star className="w-3.5 h-3.5" />
                <span className="text-xs">平均评分</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {selected?.avgRating ? selected.avgRating.toFixed(1) : '暂无'}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-teal-600 dark:text-teal-400 mb-1">
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span className="text-xs">巡查次数</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {artwork.inspectionCount}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-xs">维护总费用</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                ¥{selected?.totalCost.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* 基础信息详情 */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-primary-600" />
              基础信息
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">作者</p>
                  <p className="text-sm text-gray-900 dark:text-white">{artwork.artist}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">创作年份</p>
                  <p className="text-sm text-gray-900 dark:text-white">{artwork.year}年</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Layers className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">材质工艺</p>
                  <p className="text-sm text-gray-900 dark:text-white">{artwork.material}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">所在位置</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {artwork.district} · {artwork.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-600" />
              产权与资金
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">产权归属</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {artwork.ownership || '暂无信息'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">资金来源</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {artwork.fundingSource || '暂无信息'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ClipboardCheck className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">当前状态</p>
                  <Tag color={getStatusTagColor(artwork.statusLatest)}>
                    {artwork.statusLatest}
                  </Tag>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary-600" />
              故事背景
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {artwork.story || '暂无故事背景介绍'}
            </p>
          </div>
        </div>
      </div>

      {/* 照片画廊 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary-600" />
            照片画廊
          </h2>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 -mx-6 px-6 mb-5 overflow-x-auto">
          {PHOTO_CATEGORY_OPTIONS.map((cat) => {
            const isActive = activePhotoTab === cat;
            const count =
              cat === PhotoCategory.USER_UPLOAD
                ? selected?.userPhotos.length || 0
                : selected?.photos.filter((p) => p.category === cat).length || 0;
            return (
              <button
                key={cat}
                onClick={() => setActivePhotoTab(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                <ImageIcon className="w-4 h-4" />
                {cat}
                {count > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activePhotoTab === PhotoCategory.USER_UPLOAD ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                用户上传的偶遇照片
              </p>
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setShowPhotoForm(true)}
              >
                上传偶遇照片
              </Button>
            </div>

            {showPhotoForm && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">上传偶遇照片</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="您的昵称"
                    placeholder="请输入昵称"
                    value={photoForm.author}
                    onChange={(e) =>
                      setPhotoForm((prev) => ({ ...prev, author: e.target.value }))
                    }
                  />
                  <Input
                    label="照片链接"
                    placeholder="请输入照片URL"
                    value={photoForm.url}
                    onChange={(e) =>
                      setPhotoForm((prev) => ({ ...prev, url: e.target.value }))
                    }
                  />
                </div>
                <Textarea
                  label="照片描述"
                  placeholder="请输入照片描述..."
                  value={photoForm.description}
                  onChange={(e) =>
                    setPhotoForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowPhotoForm(false)}>
                    取消
                  </Button>
                  <Button size="sm" onClick={handleSubmitPhoto}>
                    上传
                  </Button>
                </div>
              </div>
            )}

            {selected?.userPhotos && selected.userPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {selected.userPhotos.map((photo: UserPhoto) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700"
                  >
                    <img
                      src={photo.url}
                      alt={photo.description}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">
                        {photo.author}
                      </p>
                      <p className="text-white/70 text-[10px] truncate">
                        {photo.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="暂无用户上传照片"
                description="成为第一个上传偶遇照片的人吧"
              />
            )}
          </div>
        ) : (
          <>
            {filteredPhotos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredPhotos.map((photo: Photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-lg overflow-hidden aspect-video bg-gray-100 dark:bg-gray-700"
                  >
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
                  </div>
                ))}
              </div>
            ) : (
              <Empty title={`暂无${activePhotoTab}照片`} />
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 巡查状态时间轴 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary-600" />
              巡查记录
            </h2>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowInspectionForm(true)}
            >
              新增巡查
            </Button>
          </div>

          {showInspectionForm && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4 mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">新增巡查记录</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="巡查状态"
                  value={inspectionForm.status}
                  onChange={(e) =>
                    setInspectionForm((prev) => ({
                      ...prev,
                      status: e.target.value as InspectionStatus,
                    }))
                  }
                  options={INSPECTION_STATUS_OPTIONS.map((s) => ({
                    value: s,
                    label: s,
                  }))}
                />
                <Input
                  label="巡查人员"
                  placeholder="请输入巡查人员姓名"
                  value={inspectionForm.volunteer}
                  onChange={(e) =>
                    setInspectionForm((prev) => ({ ...prev, volunteer: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  发现问题
                </label>
                <div className="flex flex-wrap gap-2">
                  {ISSUE_OPTIONS.map((issue) => (
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
                onChange={(e) =>
                  setInspectionForm((prev) => ({ ...prev, notes: e.target.value }))
                }
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
              {selected?.inspections.map((inspection: Inspection) => (
                <div key={inspection.id} className="relative pl-10">
                  <div
                    className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[inspection.status as InspectionStatus] || '#6b7280',
                    }}
                  />
                  <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Tag color={getStatusTagColor(inspection.status)}>
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
                        {inspection.issues
                          .split('、')
                          .filter(Boolean)
                          .map((issue, i) => (
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
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {inspection.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {(!selected?.inspections || selected.inspections.length === 0) && (
                <div className="pl-10">
                  <Empty title="暂无巡查记录" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 维护时间轴 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary-600" />
              维护记录
            </h2>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowMaintenanceForm(true)}
            >
              新增维护
            </Button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
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
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4 mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">新增维护记录</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="维护日期"
                  type="date"
                  value={maintenanceForm.date}
                  onChange={(e) =>
                    setMaintenanceForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
                <Select
                  label="维护类型"
                  value={maintenanceForm.workType}
                  onChange={(e) =>
                    setMaintenanceForm((prev) => ({ ...prev, workType: e.target.value }))
                  }
                  options={MAINTENANCE_TYPE_OPTIONS.map((t) => ({
                    value: t,
                    label: t,
                  }))}
                />
                <Input
                  label="施工单位"
                  placeholder="请输入施工单位名称"
                  value={maintenanceForm.contractor}
                  onChange={(e) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      contractor: e.target.value,
                    }))
                  }
                />
                <Input
                  label="费用（元）"
                  type="number"
                  placeholder="请输入维护费用"
                  value={maintenanceForm.cost || ''}
                  onChange={(e) =>
                    setMaintenanceForm((prev) => ({
                      ...prev,
                      cost: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <Textarea
                label="维护说明"
                placeholder="请输入维护内容说明..."
                value={maintenanceForm.description}
                onChange={(e) =>
                  setMaintenanceForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
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
                className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4"
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
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(maintenance.date).toLocaleDateString('zh-CN')}
                  </span>
                  <Tag color={maintenance.completed ? 'green' : 'amber'}>
                    {maintenance.completed ? '已完成' : '进行中'}
                  </Tag>
                </div>
                {maintenance.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {maintenance.description}
                  </p>
                )}
                {(maintenance.beforePhotos?.length || maintenance.afterPhotos?.length) ? (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {maintenance.beforePhotos && maintenance.beforePhotos.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">修缮前</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {maintenance.beforePhotos.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`修缮前${i + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {maintenance.afterPhotos && maintenance.afterPhotos.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">修缮后</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {maintenance.afterPhotos.map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt={`修缮后${i + 1}`}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
            {(!selected?.maintenances || selected.maintenances.length === 0) && (
              <Empty title="暂无维护记录" />
            )}
          </div>
        </div>
      </div>

      {/* 公众互动区 */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-600" />
              公众互动
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {renderStars(selected?.avgRating || 0, 'sm')}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                平均 {selected?.avgRating?.toFixed(1) || '0.0'} 分 · {selected?.comments.length || 0} 条评论
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<AlertCircle className="w-4 h-4" />}
              onClick={() => setShowFeedbackForm(true)}
            >
              纠错反馈
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCommentForm(true)}
            >
              发表评论
            </Button>
          </div>
        </div>

        {showFeedbackForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4 mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">纠错反馈</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="反馈类型"
                value={feedbackForm.type}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    type: e.target.value as FeedbackType,
                  }))
                }
                options={FEEDBACK_TYPE_OPTIONS.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
              <Input
                label="您的昵称"
                placeholder="请输入昵称"
                value={feedbackForm.reporter}
                onChange={(e) =>
                  setFeedbackForm((prev) => ({ ...prev, reporter: e.target.value }))
                }
              />
            </div>
            <Input
              label="联系方式（可选）"
              placeholder="请输入邮箱或电话，方便我们联系您"
              value={feedbackForm.contact}
              onChange={(e) =>
                setFeedbackForm((prev) => ({ ...prev, contact: e.target.value }))
              }
            />
            <Textarea
              label="问题描述"
              placeholder="请详细描述您发现的问题..."
              value={feedbackForm.description}
              onChange={(e) =>
                setFeedbackForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFeedbackForm(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleSubmitFeedback}>
                提交反馈
              </Button>
            </div>
          </div>
        )}

        {showCommentForm && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-4 mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white">发表评论</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="您的昵称"
                placeholder="请输入昵称"
                value={commentForm.author}
                onChange={(e) =>
                  setCommentForm((prev) => ({ ...prev, author: e.target.value }))
                }
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
                  评分
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setCommentForm((prev) => ({ ...prev, rating: star }))
                      }
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
              onChange={(e) =>
                setCommentForm((prev) => ({ ...prev, content: e.target.value }))
              }
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
              className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4"
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
                <div className="flex gap-2 mt-3 flex-wrap">
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
            <Empty
              title="暂无评论"
              description="来发表第一条评论，分享您的看法吧"
            />
          )}
        </div>
      </div>

      {/* 附近作品推荐 */}
      {nearbyArtworks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary-600" />
            附近作品推荐
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              （{NEARBY_DISTANCE_KM}公里内）
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyArtworks.map(({ artwork: nearby, distanceKm }) => (
              <button
                key={nearby.id}
                onClick={() => navigate(`/artwork/${nearby.id}`)}
                className="text-left bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Tag color={getTypeTagColor(nearby.type)}>{nearby.type}</Tag>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {distanceKm < 1
                          ? `${Math.round(distanceKm * 1000)}m`
                          : `${distanceKm.toFixed(1)}km`}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {nearby.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {nearby.artist} · {nearby.year}年
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 mt-1" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
