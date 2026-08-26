import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { JobPosting } from '../../api/job';
import { getJobs, createJob } from '../../api/job';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import { applyToJob } from '../../api/application';
import { useAuthStore } from '../../store/authStore';
import { Plus, MapPin, DollarSign, X } from 'lucide-react';

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const fmtSalary = (min?: number, max?: number) => {
  if (!min && !max) return null;
  const f = (v: number) => `$${(v / 1000).toFixed(0)}k`;
  if (min && max) return `${f(min)} – ${f(max)}`;
  if (min) return `From ${f(min)}`;
  return `Up to ${f(max!)}`;
};

export const JobList = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [newJob, setNewJob] = useState<Partial<JobPosting>>({
    title: '', description: '', company_id: '', location: '',
    is_remote: false, salary_min: undefined, salary_max: undefined, tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const user = useAuthStore(s => s.user);

  const fetchData = async () => {
    try {
      const [jobsData, compsData] = await Promise.all([getJobs(), getCompanies()]);
      setJobs(jobsData);
      setCompanies(compsData);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJob(newJob);
      setShowModal(false);
      setNewJob({ title: '', description: '', company_id: '', location: '', is_remote: false, tags: [] });
      fetchData();
    } catch { alert('Failed to create job'); }
    finally { setIsSubmitting(false); }
  };

  const handleApply = async (jobId: string) => {
    setApplyingId(jobId);
    try {
      await applyToJob(jobId);
      alert('Successfully applied!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply');
    } finally { setApplyingId(null); }
  };

  const getCompanyName = (id: string) =>
    companies.find(c => c.id === id)?.name || 'Unknown';

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#000', color: '#fff',
    border: '1px solid #262626', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, outline: 'none',
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Job Board</h1>
          <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Browse and apply to open positions.</p>
        </div>
        {user?.role === 'recruiter' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Post Job
          </button>
        )}
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          No jobs found. Check back later!
        </div>
      ) : (
        <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {jobs.map((job) => {
            const salary = fmtSalary(job.salary_min, job.salary_max);
            return (
              <div
                key={job.id}
                className="card animate-fade-up"
                style={{
                  padding: '20px 24px',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                {/* Left: title + meta */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{job.title}</span>
                    {job.is_remote && (
                      <span style={{
                        padding: '2px 8px', borderRadius: 4,
                        background: '#1a1a1a', color: '#737373',
                        fontSize: 11, fontWeight: 600, letterSpacing: '.04em',
                      }}>REMOTE</span>
                    )}
                  </div>
                  <div style={{ color: '#737373', fontSize: 13, marginBottom: 10, fontWeight: 500 }}>
                    {getCompanyName(job.company_id)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    {job.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#525252', fontSize: 12 }}>
                        <MapPin size={11} /> {job.location}
                      </span>
                    )}
                    {salary && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#525252', fontSize: 12 }}>
                        <DollarSign size={11} /> {salary}
                      </span>
                    )}
                    <span style={{ color: '#2a2a2a', fontSize: 12 }}>
                      {fmtDate(job.created_at)}
                    </span>
                  </div>
                </div>

                {/* Right: tags + apply */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {job.tags?.slice(0, 3).map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: 5,
                      background: '#0a0a0a', border: '1px solid #1a1a1a',
                      color: '#737373', fontSize: 12,
                    }}>{tag}</span>
                  ))}
                  {user?.role === 'candidate' && (
                    <button
                      disabled={applyingId === job.id}
                      onClick={() => handleApply(job.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '8px 18px', borderRadius: 7,
                        background: applyingId === job.id ? '#1a1a1a' : '#fff',
                        color: applyingId === job.id ? '#525252' : '#000',
                        border: 'none', fontWeight: 600, fontSize: 13,
                        cursor: applyingId === job.id ? 'not-allowed' : 'pointer',
                        transition: 'opacity .15s',
                      }}
                    >
                      {applyingId === job.id ? 'Applying…' : 'Apply'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Post Job Modal ───────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflowY: 'auto',
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="animate-fade-up" style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 560, margin: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Post a New Job</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Job Title *</label>
                  <input required style={inputStyle} value={newJob.title}
                    onChange={e => setNewJob({ ...newJob, title: e.target.value })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Company *</label>
                  {companies.length === 0 ? (
                    <div style={{ ...inputStyle, color: '#737373', fontSize: 12 }}>
                      <a href="/companies" style={{ color: '#a3a3a3' }}>Add a company first →</a>
                    </div>
                  ) : (
                    <select required style={{ ...inputStyle, appearance: 'none' }}
                      value={newJob.company_id}
                      onChange={e => setNewJob({ ...newJob, company_id: e.target.value })}>
                      <option value="" disabled>Select…</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Description *</label>
                <textarea required rows={4} style={{ ...inputStyle, resize: 'none' }}
                  value={newJob.description}
                  onChange={e => setNewJob({ ...newJob, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Location</label>
                  <input style={inputStyle} placeholder="e.g. New York, NY"
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#d4d4d4' }}>
                    <input type="checkbox" checked={newJob.is_remote}
                      onChange={e => setNewJob({ ...newJob, is_remote: e.target.checked })}
                      style={{ width: 15, height: 15 }} />
                    Remote position
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Min Salary (USD)</label>
                  <input type="number" style={inputStyle}
                    value={newJob.salary_min || ''}
                    onChange={e => setNewJob({ ...newJob, salary_min: parseInt(e.target.value) || undefined })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Max Salary (USD)</label>
                  <input type="number" style={inputStyle}
                    value={newJob.salary_max || ''}
                    onChange={e => setNewJob({ ...newJob, salary_max: parseInt(e.target.value) || undefined })} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Tags (press Enter)</label>
                <div style={{ ...inputStyle, display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 44 }}>
                  {newJob.tags?.map(tag => (
                    <span key={tag} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 8px', borderRadius: 4,
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      color: '#d4d4d4', fontSize: 12,
                    }}>
                      {tag}
                      <button type="button" onClick={() => setNewJob({ ...newJob, tags: newJob.tags?.filter(t => t !== tag) })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                  <input type="text" value={tagInput}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1, minWidth: 80 }}
                    placeholder="e.g. React"
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim() && !newJob.tags?.includes(tagInput.trim())) {
                          setNewJob({ ...newJob, tags: [...(newJob.tags || []), tagInput.trim()] });
                          setTagInput('');
                        }
                      }
                    }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                  disabled={isSubmitting}>
                  {isSubmitting ? 'Publishing…' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
