import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useParams, Link } from 'react-router-dom';
import type { Application } from '../../api/application';
import { getJobApplications, updateApplicationStatus } from '../../api/application';
import { ChevronLeft, User } from 'lucide-react';

// Must match backend ApplicationStatus enum values exactly (PostgreSQL stores uppercase labels)
const STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEWING', 'OFFERED', 'REJECTED', 'WITHDRAWN'];

const STATUS_LABEL: Record<string, string> = {
  APPLIED:      'Applied',
  SCREENING:    'Screening',
  INTERVIEWING: 'Interviewing',
  OFFERED:      'Offered',
  REJECTED:     'Rejected',
  WITHDRAWN:    'Withdrawn',
};

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  APPLIED:      { background: 'rgba(255,255,255,.06)', color: '#a3a3a3', border: '1px solid #2a2a2a' },
  SCREENING:    { background: 'rgba(255,255,255,.08)', color: '#d4d4d4', border: '1px solid #3a3a3a' },
  INTERVIEWING: { background: 'rgba(255,255,255,.12)', color: '#fff',    border: '1px solid #555' },
  OFFERED:      { background: 'rgba(255,255,255,.16)', color: '#fff',    border: '1px solid #888' },
  REJECTED:     { background: 'rgba(80,0,0,.4)',       color: '#f87171', border: '1px solid #7f1d1d' },
  WITHDRAWN:    { background: 'rgba(255,255,255,.04)', color: '#525252', border: '1px solid #1c1c1c' },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const ATSDashboard = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchApps = async () => {
    if (!jobId) return;
    setError('');
    try {
      const data = await getJobApplications(jobId);
      setApplications(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, [jobId]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdating(appId);
    try {
      await updateApplicationStatus(appId, newStatus);
      setApplications(prev =>
        prev.map(app => app.id === appId ? { ...app, status: newStatus } : app)
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const jobTitle = applications.length > 0 ? applications[0].job_title : 'Job Posting';
  const companyName = applications.length > 0 ? applications[0].company_name : '';

  const StatusBadge = ({ status }: { status: string }) => (
    <span style={{
      ...STATUS_STYLE[status] ?? STATUS_STYLE['applied'],
      display: 'inline-block',
      padding: '3px 10px', borderRadius: 99,
      fontSize: 11, fontWeight: 600, letterSpacing: '.04em',
      textTransform: 'uppercase',
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <Link to="/ats" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: '#525252', textDecoration: 'none', marginBottom: 16,
          transition: 'color .15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#525252')}
        >
          <ChevronLeft size={14} /> Back to ATS
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>{jobTitle}</h1>
            {companyName && <p style={{ margin: '4px 0 0', color: '#737373', fontSize: 14 }}>{companyName}</p>}
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: '#0a0a0a', border: '1px solid #1a1a1a',
            fontSize: 13, color: '#a3a3a3',
          }}>
            {applications.length} applicant{applications.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(80,0,0,.3)', border: '1px solid #7f1d1d', color: '#f87171', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="spinner" />
        </div>
      ) : applications.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          <User size={32} style={{ opacity: .3, marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 15 }}>No applicants yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Share the job posting to start receiving applications.</p>
        </div>
      ) : (
        <div className="animate-fade-up" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Applicant', 'Applied', 'Cover Note', 'Status', 'Move to'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    color: '#525252', fontWeight: 500, fontSize: 12,
                    letterSpacing: '.06em', textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app, idx) => (
                <tr
                  key={app.id}
                  className="animate-fade-up"
                  style={{
                    borderBottom: '1px solid #0f0f0f',
                    animationDelay: `${idx * 40}ms`,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0a0a0a')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Applicant */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, color: '#737373', fontWeight: 600, flexShrink: 0,
                      }}>
                        {app.id.slice(-2).toUpperCase()}
                      </div>
                      <span style={{ color: '#d4d4d4', fontFamily: 'monospace', fontSize: 12 }}>
                        ···{app.id.slice(-8)}
                      </span>
                    </div>
                  </td>
                  {/* Applied */}
                  <td style={{ padding: '14px 16px', color: '#737373', whiteSpace: 'nowrap' }}>
                    {formatDate(app.applied_at)}
                  </td>
                  {/* Cover Note */}
                  <td style={{ padding: '14px 16px', color: '#737373', maxWidth: 260 }}>
                    {app.cover_note ? (
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {app.cover_note}
                      </span>
                    ) : (
                      <span style={{ color: '#2a2a2a' }}>—</span>
                    )}
                  </td>
                  {/* Current Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={app.status} />
                  </td>
                  {/* Move to select */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <select
                        disabled={updating === app.id}
                        value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value)}
                        style={{
                          background: '#0a0a0a', color: '#d4d4d4',
                          border: '1px solid #262626', borderRadius: 7,
                          padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                          outline: 'none', appearance: 'none',
                          paddingRight: 28,
                          opacity: updating === app.id ? .5 : 1,
                          transition: 'border-color .15s',
                          minWidth: 150,
                        }}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <div style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        pointerEvents: 'none', color: '#525252', fontSize: 10,
                      }}>▼</div>
                      {updating === app.id && (
                        <div style={{
                          position: 'absolute', right: -24, top: '50%', transform: 'translateY(-50%)',
                          width: 14, height: 14, border: '2px solid #333', borderTopColor: '#fff',
                          borderRadius: '50%', animation: 'spin .7s linear infinite',
                        }} />
                      )}
                    </div>
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
