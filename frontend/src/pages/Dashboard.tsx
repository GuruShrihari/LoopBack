import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getMyApplications } from '../api/application';
import { useAuthStore } from '../store/authStore';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  
  const [stats, setStats] = useState({
    active: 0,
    interviews: 0,
    offers: 0
  });

  useEffect(() => {
    if (user?.role === 'candidate') {
      const fetchStats = async () => {
        try {
          const apps = await getMyApplications();
          let active = 0, interviews = 0, offers = 0;
          apps.forEach(app => {
            if (['applied', 'screening'].includes(app.status)) active++;
            if (app.status === 'interviewing') interviews++;
            if (app.status === 'offered') offers++;
          });
          setStats({ active, interviews, offers });
        } catch (err) {
          console.error(err);
        }
      };
      fetchStats();
    }
  }, [user]);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to LoopBack. Your recruitment data lives here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
          <h3 className="text-lg font-medium mb-1 text-gray-300">Active Applications</h3>
          <p className="text-3xl font-bold text-indigo-400 group-hover:scale-105 transform origin-left transition-transform">{stats.active}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
          <h3 className="text-lg font-medium mb-1 text-gray-300">Interviews Scheduled</h3>
          <p className="text-3xl font-bold text-indigo-400 group-hover:scale-105 transform origin-left transition-transform">{stats.interviews}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/30 transition-colors group">
          <h3 className="text-lg font-medium mb-1 text-gray-300">Offers Received</h3>
          <p className="text-3xl font-bold text-indigo-400 group-hover:scale-105 transform origin-left transition-transform">{stats.offers}</p>
        </div>
      </div>
    </Layout>
  );
};
