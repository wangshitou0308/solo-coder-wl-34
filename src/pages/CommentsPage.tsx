import { useEffect, useState, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Star,
  User,
  Calendar,
  Trash2,
  Clock,
} from 'lucide-react';
import { useArtworkStore } from '@/store/useArtworkStore';
import { DISTRICT_OPTIONS, ARTWORK_TYPE_OPTIONS, TYPE_COLORS } from '@/utils/constants';
import { ArtworkType, Artwork } from '@/types';
import { Comment } from '../../db';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import { commentRepo } from '../../db';

export default function CommentsPage() {
  const { initialize, artworks, comments, loading } = useArtworkStore();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Comment | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const getArtworkName = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.name || '未知作品';
  };

  const getArtworkType = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.type || '';
  };

  const getArtworkDistrict = (artworkId: number): string => {
    return artworks.find(a => a.id === artworkId)?.district || '';
  };

  const filteredComments = useMemo(() => {
    let result = [...comments];
    if (filterRating !== null) {
      result = result.filter(c => c.rating === filterRating);
    }
    if (filterDistrict) {
      const artworkIdsInDistrict = artworks.filter(a => a.district === filterDistrict).map(a => a.id);
      result = result.filter(c => artworkIdsInDistrict.includes(c.artworkId));
    }
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      result = result.filter(c => {
        const artwork = artworks.find(a => a.id === c.artworkId);
        return (
          c.author.toLowerCase().includes(kw) ||
          c.content.toLowerCase().includes(kw) ||
          (artwork && artwork.name.toLowerCase().includes(kw))
        );
      });
    }
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [comments, filterRating, filterDistrict, searchKeyword, artworks]);

  const stats = useMemo(() => {
    const total = comments.length;
    const avgRating = total > 0
      ? (comments.reduce((sum, c) => sum + c.rating, 0) / total).toFixed(1)
      : '0.0';
    const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    comments.forEach(c => {
      ratingCounts[c.rating] = (ratingCounts[c.rating] || 0) + 1;
    });
    const topArtworks: { artwork: Artwork; count: number; avgRating: number }[] = [];
    const artworkComments: Record<number, Comment[]> = {};
    comments.forEach(c => {
      if (!artworkComments[c.artworkId]) artworkComments[c.artworkId] = [];
      artworkComments[c.artworkId].push(c);
    });
    Object.entries(artworkComments).forEach(([artworkId, cs]) => {
      const artwork = artworks.find(a => a.id === Number(artworkId));
      if (artwork) {
        topArtworks.push({
          artwork,
          count: cs.length,
          avgRating: cs.reduce((s, c) => s + c.rating, 0) / cs.length,
        });
      }
    });
    topArtworks.sort((a, b) => b.count - a.count);
    return { total, avgRating, ratingCounts, topArtworks: topArtworks.slice(0, 5) };
  }, [comments, artworks]);

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      ))}
    </div>
  );

  const handleDelete = async (comment: Comment) => {
    if (!comment.id) return;
    try {
      await commentRepo.delete(comment.id);
      setDeleteConfirm(null);
      await useArtworkStore.getState().loadComments();
    } catch (error) {
      console.error('删除评论失败:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-primary-600" />
            评论管理
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            查看和管理用户对公共艺术作品的评论与评分
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Filter className="w-4 h-4" />}
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          {showFilterPanel ? '收起筛选' : '展开筛选'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <MessageSquare className="w-4 h-4" />
            评论总数
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 col-span-2">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-2">
            <Star className="w-4 h-4" />
            平均评分
          </div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-amber-500">{stats.avgRating}</p>
            {renderStars(Number(stats.avgRating))}
          </div>
        </div>
        {[5, 4, 3, 2, 1].slice(0, 3).map(rating => (
          <div key={rating} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mb-2">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {rating}星
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.ratingCounts[rating] || 0}
            </p>
          </div>
        ))}
      </div>

      {stats.topArtworks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">评论最多的作品 TOP 5</h3>
          <div className="flex flex-wrap gap-3">
            {stats.topArtworks.map(({ artwork, count, avgRating }, idx) => (
              <div key={artwork.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-lg">
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
                  <p className="text-xs font-medium text-gray-900 dark:text-white">{artwork.name}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">{count}条</span>
                    <span className="text-amber-500">{avgRating.toFixed(1)}★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="搜索评论内容、作者、作品名称..."
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
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">评分等级</label>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1',
                      filterRating === rating
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    <Star className="w-3 h-3" /> {rating}星
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

      {filteredComments.length === 0 ? (
        <Empty
          title="暂无评论"
          description="没有找到符合条件的评论"
        />
      ) : (
        <div className="space-y-3">
          {filteredComments.map(comment => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.author}
                      </span>
                      {renderStars(comment.rating)}
                      <Tag
                        color={
                          getArtworkType(comment.artworkId) === ArtworkType.SCULPTURE ? 'teal' :
                          getArtworkType(comment.artworkId) === ArtworkType.MURAL ? 'purple' :
                          getArtworkType(comment.artworkId) === ArtworkType.INSTALLATION ? 'amber' :
                          getArtworkType(comment.artworkId) === ArtworkType.FOUNTAIN ? 'blue' :
                          getArtworkType(comment.artworkId) === ArtworkType.MONUMENT ? 'red' : 'green'
                        }
                      >
                        {getArtworkName(comment.artworkId)}
                      </Tag>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(comment.date)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(comment.date)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                    {comment.photos && comment.photos.length > 0 && (
                      <div className="mt-3 flex gap-2">
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
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                  onClick={() => setDeleteConfirm(comment)}
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
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
            确定要删除这条评论吗？此操作不可撤销。
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
