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
            if (['APPLIED', 'SCREENING'].includes(app.status)) active++;
            if (app.status === 'INTERVIEWING') interviews++;
            if (app.status === 'OFFERED') offers++;
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
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Welcome to LoopBack. Your recruitment data lives here.</p>
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card animate-fade-up" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#737373', textTransform: 'uppercase', letterSpacing: '.04em' }}>Active Applications</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff' }}>{stats.active}</p>
        </div>
        <div className="card animate-fade-up" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#737373', textTransform: 'uppercase', letterSpacing: '.04em' }}>Interviews Scheduled</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff' }}>{stats.interviews}</p>
        </div>
        <div className="card animate-fade-up" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: '#737373', textTransform: 'uppercase', letterSpacing: '.04em' }}>Offers Received</h3>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff' }}>{stats.offers}</p>
        </div>
      </div>
    </Layout>
  );
};
