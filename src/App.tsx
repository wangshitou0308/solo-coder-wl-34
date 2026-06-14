/**
 * 应用根组件
 * 配置路由结构并引入Layout布局
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import MapPage from '@/pages/MapPage'
import DashboardPage from '@/pages/DashboardPage'
import ArtworksListPage from '@/pages/ArtworksListPage'
import InspectionsPage from '@/pages/InspectionsPage'
import MaintenancePage from '@/pages/MaintenancePage'
import VolunteersPage from '@/pages/VolunteersPage'
import CommentsPage from '@/pages/CommentsPage'
import PhotosPage from '@/pages/PhotosPage'
import RoutePage from '@/pages/RoutePage'
import ArtworkDetailPage from '@/pages/ArtworkDetailPage'
import CommunityPage from '@/pages/CommunityPage'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MapPage />} />
          <Route path="/list" element={<ArtworksListPage />} />
          <Route path="/analytics" element={<DashboardPage />} />
          <Route path="/inspections" element={<InspectionsPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/volunteers" element={<VolunteersPage />} />
          <Route path="/comments" element={<CommentsPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/path" element={<RoutePage />} />
          <Route path="/artwork/:id" element={<ArtworkDetailPage />} />
          <Route path="/community" element={<CommunityPage />} />
        </Route>
        <Route path="*" element={<div className="flex items-center justify-center min-h-screen text-2xl text-slate-600">404 - 页面不存在</div>} />
      </Routes>
    </Router>
  )
}
