import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { Application } from '../../api/application';
import { getMyApplications } from '../../api/application';
import { submitIntel } from '../../api/intel';
import { Building2, Share2, Plus, X, Trash2 } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusBadge = (status: string) => {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {status}
    </span>
  );
};

export const ApplicationList = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Intel Modal State
  const [intelApp, setIntelApp] = useState<Application | null>(null);
  const [intelData, setIntelData] = useState({
    rounds: [{ title: '', description: '' }],
    overall_difficulty: 3,
    outcome: '',
    is_anonymous: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await getMyApplications();
        setApplications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleAddRound = () => {
    setIntelData({ ...intelData, rounds: [...intelData.rounds, { title: '', description: '' }] });
  };

  const handleRemoveRound = (index: number) => {
    const newRounds = intelData.rounds.filter((_, i) => i !== index);
    setIntelData({ ...intelData, rounds: newRounds });
  };

  const handleRoundChange = (index: number, field: string, value: string) => {
    const newRounds = [...intelData.rounds];
    newRounds[index] = { ...newRounds[index], [field]: value };
    setIntelData({ ...intelData, rounds: newRounds });
  };

  const handleSubmitIntel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intelApp) return;
    setIsSubmitting(true);
    try {
      await submitIntel({
        posting_id: intelApp.posting_id,
        rounds: intelData.rounds,
        overall_difficulty: intelData.overall_difficulty,
        outcome: intelData.outcome || undefined,
        is_anonymous: intelData.is_anonymous
      });
      alert("Intel shared successfully!");
      setIntelApp(null);
      setIntelData({ rounds: [{ title: '', description: '' }], overall_difficulty: 3, outcome: '', is_anonymous: true });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit intel");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>My Applications</h1>
        <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Track the status of your active job applications.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="spinner" />
        </div>
      ) : applications.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          You haven't applied to any jobs yet. Go to the Job Board to find your next role!
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {applications.map((app) => (
            <div key={app.id} className="card animate-fade-up" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#fff' }} title={app.job_title}>
                    {app.job_title}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#a3a3a3' }}>
                    <Building2 size={14} />
                    {app.company_name}
                  </div>
                </div>
                {/* Only show intel button if they have reached interview stage or higher */}
                {['INTERVIEWING', 'OFFERED', 'REJECTED'].includes(app.status) && (
                  <button 
                    onClick={() => setIntelApp(app)}
                    title="Share Interview Intel"
                    style={{
                      background: '#1a1a1a', border: 'none', color: '#d4d4d4',
                      padding: 8, borderRadius: 8, cursor: 'pointer',
                      transition: 'background .15s, color .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.color = '#d4d4d4'; }}
                  >
                    <Share2 size={16} />
                  </button>
                )}
              </div>

              <div style={{ marginBottom: 24 }}>
                {getStatusBadge(app.status)}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#525252' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Applied</span>
                  <span style={{ color: '#a3a3a3', fontWeight: 500 }}>{formatDate(app.applied_at)}</span>
                </div>
                {app.last_employer_response_at && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Last Response</span>
                    <span style={{ color: '#a3a3a3', fontWeight: 500 }}>{formatDate(app.last_employer_response_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Intel Modal */}
      {intelApp && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflowY: 'auto'
        }} onClick={e => { if (e.target === e.currentTarget) setIntelApp(null); }}>
          <div className="animate-fade-up" style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 560, margin: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Share Interview Intel</h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#737373' }}>
                  Help the community by anonymously sharing your interview experience for <strong style={{ color: '#fff' }}>{intelApp.job_title}</strong> at <strong style={{ color: '#fff' }}>{intelApp.company_name}</strong>.
                </p>
              </div>
              <button onClick={() => setIntelApp(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitIntel} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#737373', fontWeight: 500 }}>Interview Rounds</label>
                  <button type="button" onClick={handleAddRound} style={{
                    background: 'none', border: 'none', color: '#d4d4d4', fontSize: 12,
                    display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer'
                  }}>
                    <Plus size={14} /> Add Round
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {intelData.rounds.map((round, idx) => (
                    <div key={idx} style={{ background: '#000', padding: 16, borderRadius: 10, border: '1px solid #1a1a1a', position: 'relative' }}>
                      {intelData.rounds.length > 1 && (
                        <button type="button" onClick={() => handleRemoveRound(idx)} style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'none', border: 'none', color: '#525252', cursor: 'pointer'
                        }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                      <input 
                        required placeholder={`Round ${idx + 1} Title (e.g. Technical Screen)`}
                        value={round.title} onChange={e => handleRoundChange(idx, 'title', e.target.value)}
                        className="input-base" style={{ marginBottom: 10, paddingRight: 32 }}
                      />
                      <textarea 
                        required placeholder="What were you asked? How did it go?" rows={3}
                        value={round.description} onChange={e => handleRoundChange(idx, 'description', e.target.value)}
                        className="input-base" style={{ resize: 'none' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Overall Difficulty (1-5)</label>
                  <input 
                    type="range" min="1" max="5" 
                    value={intelData.overall_difficulty} onChange={e => setIntelData({...intelData, overall_difficulty: parseInt(e.target.value)})}
                    style={{ width: '100%', margin: '8px 0' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#525252' }}>
                    <span>Easy</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>{intelData.overall_difficulty} / 5</span>
                    <span>Hard</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Outcome</label>
                  <select 
                    value={intelData.outcome} onChange={e => setIntelData({...intelData, outcome: e.target.value})}
                    className="input-base" style={{ appearance: 'none' }}
                  >
                    <option value="">Pending / Unknown</option>
                    <option value="Offered">Received Offer</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Withdrew">I Withdrew</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: '#a3a3a3' }}>
                  <input 
                    type="checkbox" checked={intelData.is_anonymous} onChange={e => setIntelData({...intelData, is_anonymous: e.target.checked})}
                    style={{ width: 16, height: 16 }}
                  />
                  Keep my identity strictly anonymous
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIntelApp(null)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Sharing…' : 'Share Intel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
