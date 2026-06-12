import { useEffect, useState } from 'react';
import {
  BarChart3,
  Palette,
  Layers,
  MapPin,
  AlertTriangle,
  Users,
  Eye,
  TrendingUp,
  Calendar,
  Shield,
} from 'lucide-react';
import { useArtworkStore, DashboardStats } from '@/store/useArtworkStore';
import { TYPE_COLORS, STATUS_COLORS, DISTRICT_OPTIONS } from '@/utils/constants';
import { ArtworkType, InspectionStatus } from '@/types';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { initialize, artworks, volunteers, inspections, getDashboardStats } = useArtworkStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (artworks.length > 0) {
      getDashboardStats().then(setStats);
    }
  }, [artworks, getDashboardStats]);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color = 'primary',
  }: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    color?: 'primary' | 'green' | 'amber' | 'red' | 'purple';
  }) => {
    const colorClasses = {
      primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
      green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            {subValue && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</p>
            )}
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            数据看板
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            全市公共艺术作品统计概览
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          数据更新于 {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Palette}
          label="作品总数"
          value={stats?.totalArtworks || 0}
          subValue={`${DISTRICT_OPTIONS.length} 个行政区`}
          color="primary"
        />
        <StatCard
          icon={Shield}
          label="本月巡查覆盖率"
          value={`${stats?.monthlyCoverage || 0}%`}
          subValue={`${inspections.length} 次巡查记录`}
          color="green"
        />
        <StatCard
          icon={AlertTriangle}
          label="待维护作品"
          value={stats?.pendingMaintenance.length || 0}
          subValue="需要关注"
          color="amber"
        />
        <StatCard
          icon={Users}
          label="注册志愿者"
          value={volunteers.length}
          subValue="活跃巡查员"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            类型分布
          </h3>
          <div className="space-y-3">
            {stats?.typeDistribution &&
              Object.entries(stats.typeDistribution).map(([type, count]) => {
                const percentage = stats.totalArtworks > 0
                  ? Math.round((count / stats.totalArtworks) * 100)
                  : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TYPE_COLORS[type as ArtworkType] || '#6b7280' }}
                        />
                        {type}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {count} 件 ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: TYPE_COLORS[type as ArtworkType] || '#6b7280',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            区域分布
          </h3>
          <div className="space-y-3">
            {stats?.districtDistribution &&
              Object.entries(stats.districtDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([district, count]) => {
                  const percentage = stats.totalArtworks > 0
                    ? Math.round((count / stats.totalArtworks) * 100)
                    : 0;
                  return (
                    <div key={district}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {district}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {count} 件 ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            状态分布
          </h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {stats?.statusDistribution &&
              Object.entries(stats.statusDistribution).map(([status, count]) => (
                <div
                  key={status}
                  className="text-center p-3 rounded-lg"
                  style={{
                    backgroundColor: `${STATUS_COLORS[status as InspectionStatus]}20`,
                  }}
                >
                  <p className="text-xl font-bold" style={{ color: STATUS_COLORS[status as InspectionStatus] }}>
                    {count}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{status}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-600" />
            材质分布
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats?.materialDistribution &&
              Object.entries(stats.materialDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([material, count]) => (
                  <Tag key={material} color="purple">
                    {material} · {count}件
                  </Tag>
                ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-600" />
            最受欢迎作品 TOP 10
          </h3>
          <div className="space-y-2">
            {stats?.topArtworks.slice(0, 10).map((artwork, index) => (
              <div
                key={artwork.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index < 3
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {artwork.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {artwork.type} · {artwork.district}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {artwork.viewCount}
                  </p>
                  <p className="text-xs text-gray-400">浏览量</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            志愿者贡献排行
          </h3>
          <div className="space-y-2">
            {stats?.topVolunteers.slice(0, 10).map((volunteer, index) => (
              <div
                key={volunteer.id}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index < 3
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {volunteer.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    加入 {new Date(volunteer.joinDate).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {volunteer.inspectionCount}
                  </p>
                  <p className="text-xs text-gray-400">巡查次数</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          待维护清单
          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            {stats?.pendingMaintenance.length || 0} 件
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  作品名称
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  类型
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  区域
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  当前状态
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  材质
                </th>
              </tr>
            </thead>
            <tbody>
              {stats?.pendingMaintenance.map(artwork => (
                <tr
                  key={artwork.id}
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {artwork.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{artwork.artist}</p>
                  </td>
                  <td className="py-3 px-3">
                    <Tag color="purple">{artwork.type}</Tag>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300">
                    {artwork.district}
                  </td>
                  <td className="py-3 px-3">
                    <Tag
                      color={artwork.statusLatest === InspectionStatus.SEVERE ? 'red' : 'amber'}
                    >
                      {artwork.statusLatest}
                    </Tag>
                  </td>
                  <td className="py-3 px-3 text-sm text-gray-600 dark:text-gray-300">
                    {artwork.material}
                  </td>
                </tr>
              ))}
              {(!stats?.pendingMaintenance || stats.pendingMaintenance.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    暂无待维护作品
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
