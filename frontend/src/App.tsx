import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CompanyList } from './pages/Companies/CompanyList';
import { JobList } from './pages/Jobs/JobList';
import { ApplicationList } from './pages/Applications/ApplicationList';
import { ATSList } from './pages/ATS/ATSList';
import { ATSDashboard } from './pages/ATS/ATSDashboard';
import { IntelFeed } from './pages/Intel/IntelFeed';
import { ReferralHub } from './pages/Referrals/ReferralHub';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/applications" element={<ApplicationList />} />
          <Route path="/ats" element={<ATSList />} />
          <Route path="/ats/:jobId" element={<ATSDashboard />} />
          <Route path="/intel" element={<IntelFeed />} />
          <Route path="/referrals" element={<ReferralHub />} />
        </Route>

        {/* Fallback */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
