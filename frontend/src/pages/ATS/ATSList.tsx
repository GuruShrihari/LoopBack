import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { JobPosting } from '../../api/job';
import { getMyJobs } from '../../api/job';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const ATSList = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, compsData] = await Promise.all([getMyJobs(), getCompanies()]);
        setJobs(jobsData);
        setCompanies(compsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCompanyName = (id: string) =>
    companies.find(c => c.id === id)?.name || 'Unknown Company';

  return (
    <Layout>
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>ATS Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Select a job to review and manage applicants.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="spinner" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          <p style={{ margin: 0, fontSize: 15 }}>You haven't posted any jobs yet.</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>
            <Link to="/jobs" style={{ color: '#d4d4d4' }}>Go to the Job Board →</Link>
          </p>
        </div>
      ) : (
        <div className="animate-fade-up" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Position', 'Company', 'Location', 'Posted', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#525252', fontWeight: 500, fontSize: 12,
                    letterSpacing: '.06em', textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, idx) => (
                <tr
                  key={job.id}
                  className="animate-fade-up"
                  style={{ borderBottom: '1px solid #0f0f0f', animationDelay: `${idx * 40}ms`, transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0a0a0a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>{job.title}</div>
                    {job.is_remote && (
                      <span style={{
                        display: 'inline-block', marginTop: 4,
                        padding: '1px 8px', borderRadius: 4,
                        background: '#1a1a1a', color: '#737373',
                        fontSize: 11, fontWeight: 500,
                      }}>Remote</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: '#737373' }}>{getCompanyName(job.company_id)}</td>
                  <td style={{ padding: '16px', color: '#525252' }}>
                    {job.location ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={12} /> {job.location}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '16px', color: '#525252', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} /> {formatDate(job.created_at)}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <Link
                      to={`/ats/${job.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '6px 14px', borderRadius: 7,
                        background: '#0a0a0a', border: '1px solid #1a1a1a',
                        color: '#d4d4d4', textDecoration: 'none',
                        fontSize: 13, fontWeight: 500,
                        transition: 'border-color .15s, color .15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#d4d4d4'; }}
                    >
                      Review <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};
