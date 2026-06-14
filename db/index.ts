import { ArtworkRepository } from '../src/db/repositories/artwork';
import { InspectionRepository } from '../src/db/repositories/inspection';
import { MaintenanceRepository } from '../src/db/repositories/maintenance';
import { CommentRepository } from '../src/db/repositories/comment';
import { PhotoRepository, UserPhotoRepository } from '../src/db/repositories/photo';
import { VolunteerRepository } from '../src/db/repositories/volunteer';
import { SubmissionRepository } from '../src/db/repositories/submission';
import { FavoriteRepository } from '../src/db/repositories/favorite';
import { FeedbackRepository } from '../src/db/repositories/feedback';

/**
 * 艺术品仓库单例实例
 */
export const artworkRepo = new ArtworkRepository();

/**
 * 巡检记录仓库单例实例
 */
export const inspectionRepo = new InspectionRepository();

/**
 * 维护记录仓库单例实例
 */
export const maintenanceRepo = new MaintenanceRepository();

/**
 * 评论仓库单例实例
 */
export const commentRepo = new CommentRepository();

/**
 * 官方照片仓库单例实例
 */
export const photoRepo = new PhotoRepository();

/**
 * 用户上传照片仓库单例实例
 */
export const userPhotoRepo = new UserPhotoRepository();

/**
 * 志愿者仓库单例实例
 */
export const volunteerRepo = new VolunteerRepository();

/**
 * 居民投稿仓库单例实例
 */
export const submissionRepo = new SubmissionRepository();

/**
 * 收藏仓库单例实例
 */
export const favoriteRepo = new FavoriteRepository();

/**
 * 纠错反馈仓库单例实例
 */
export const feedbackRepo = new FeedbackRepository();

/**
 * 导出数据库核心类型和方法
 */
export {
  openPublicArtDB,
  closePublicArtDB,
  DB_NAME,
  DB_VERSION,
} from '../src/db';

export type {
  Artwork,
  Inspection,
  Maintenance,
  Comment,
  Photo,
  UserPhoto,
  Volunteer,
  Setting,
  Submission,
  Favorite,
  Feedback,
  PublicArtDB,
  PublicArtDBSchema,
} from '../src/db';

export type { ArtworkFilter } from '../src/db/repositories/artwork';
