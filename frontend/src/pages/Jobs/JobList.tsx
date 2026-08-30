import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { useAuthStore } from '../../store/authStore';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import type { JobPosting } from '../../api/job';
import { getJobs, createJob } from '../../api/job';
import { createApplication, getMyApplications } from '../../api/application';
import type { ReferralOffer } from '../../api/referral';
import { getReferralOffers, createReferralRequest } from '../../api/referral';
import { Search, Plus, MapPin, DollarSign, X, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';
import apiClient from '../../api/client';

export const JobList = () => {
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const companyFilterId = searchParams.get('company_id');

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [offers, setOffers] = useState<ReferralOffer[]>([]);
  const [appliedPostingIds, setAppliedPostingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Post Job
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState<Partial<JobPosting>>({
    title: '', description: '', requirements: '', location: '', is_remote: false,
    tags: [], response_timeframe_days: 30, referral_limit: 5, company_id: user?.employer_id || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply to Job
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [applyResume, setApplyResume] = useState<File | null>(null);
  const [applyNote, setApplyNote] = useState('');
  const [applying, setApplying] = useState(false);

  // Ask for Referral
  const [referralJobId, setReferralJobId] = useState<string | null>(null);
  const [referralResume, setReferralResume] = useState<File | null>(null);
  const [referralNote, setReferralNote] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [requestingReferral, setRequestingReferral] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [j, c, o] = await Promise.all([getJobs(), getCompanies(), getReferralOffers()]);
      setJobs(j);
      setCompanies(c);
      setOffers(o);

      if (user?.role === 'candidate') {
        const myApps = await getMyApplications();
        const ids = new Set(myApps.map(a => a.posting_id));
        setAppliedPostingIds(ids);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [user]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJob.title || !newJob.description) return;
    setIsSubmitting(true);
    try {
      await createJob({ ...newJob, company_id: user?.employer_id || newJob.company_id } as any);
      setShowModal(false);
      setNewJob({ title: '', description: '', tags: [], response_timeframe_days: 30, referral_limit: 5 });
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadResume = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/upload/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  };

  const handleApply = async () => {
    if (!applyJobId || !applyResume) {
      alert("Resume is required to apply.");
      return;
    }
    setApplying(true);
    try {
      const url = await uploadResume(applyResume);
      await createApplication({ posting_id: applyJobId, resume_url: url, cover_note: applyNote });
      setAppliedPostingIds(prev => new Set([...prev, applyJobId]));
      setApplyJobId(null);
      setApplyResume(null);
      setApplyNote('');
      alert("Application submitted! The job has moved to your 'My Applications' list.");
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const handleRequestReferral = async () => {
    if (!referralJobId || !selectedOfferId || !referralResume) {
      alert("Resume and Referrer selection are required.");
      return;
    }
    setRequestingReferral(true);
    try {
      const url = await uploadResume(referralResume);
      await createReferralRequest(selectedOfferId, { posting_id: referralJobId, resume_url: url, message: referralNote });
      setReferralJobId(null);
      setReferralResume(null);
      setReferralNote('');
      setSelectedOfferId('');
      alert("Referral request sent!");
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to request referral');
    } finally {
      setRequestingReferral(false);
    }
  };

  const companyName = (id: string) => companies.find(c => c.id === id)?.name || 'Unknown Company';
  const selectedCompany = companyFilterId ? companies.find(c => c.id === companyFilterId) : null;
  const myCompany = companies.find(c => c.id === user?.employer_id);
  const isCompanyCreator = Boolean(user?.employer_id && myCompany && myCompany.created_by_user_id === user?.id);

  const filteredJobs = jobs.filter(j => {
    if (j.status !== 'active') return false;
    if (companyFilterId && j.company_id !== companyFilterId) return false;
    if (user?.role === 'candidate' && appliedPostingIds.has(j.id)) return false;
    const cName = companyName(j.company_id).toLowerCase();
    const query = search.toLowerCase();
    return j.title.toLowerCase().includes(query) || cName.includes(query);
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0a0a0a', color: '#fff', border: '1px solid #262626',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none'
  };

  return (
    <Layout>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>
              {selectedCompany ? `${selectedCompany.name} Jobs` : 'Job Board'}
            </h1>
            <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>
              {selectedCompany ? `Explore active job openings at ${selectedCompany.name}.` : 'Browse open opportunities or request an insider referral.'}
            </p>
          </div>
          {isCompanyCreator && (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Post New Job
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#525252' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 40 }}
              placeholder="Search roles or technologies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {selectedCompany && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #262626', padding: '6px 12px', borderRadius: 8, fontSize: 13, color: '#fff' }}>
              <Building2 size={14} color="#a3a3a3" />
              <span>Company: <strong>{selectedCompany.name}</strong></span>
              <button
                onClick={() => setSearchParams({})}
                style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Jobs list */}
        {loading ? (
          <div className="card" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>Loading job postings…</div>
        ) : (
          <div className="stagger">
            {filteredJobs.length === 0 ? (
              <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
                {user?.role === 'candidate' && appliedPostingIds.size > 0 && jobs.length > 0 ? (
                  <div>
                    <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 12px', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: 16, color: '#fff', fontWeight: 600 }}>All available jobs applied!</p>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#737373' }}>You have applied to all matching roles. Check status under My Apps.</p>
                  </div>
                ) : (
                  'No open positions found matching your search.'
                )}
              </div>
            ) : (
              filteredJobs.map(job => {
                const jobOffers = offers.filter(o => o.posting_id === job.id);
                return (
                  <div key={job.id} className="card animate-fade-up" style={{ padding: 24, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#fff' }}>{job.title}</h3>
                        <div style={{ color: '#a3a3a3', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={14} /> {companyName(job.company_id)}
                        </div>
                      </div>

                      {user?.role === 'candidate' && (
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {jobOffers.length > 0 && (
                            <button
                              className="btn-ghost"
                              onClick={() => setReferralJobId(job.id)}
                              style={{ padding: '8px 16px', fontSize: 13, color: '#eab308', borderColor: '#422006' }}
                            >
                              Ask for Referral ({jobOffers.length})
                            </button>
                          )}
                          <button
                            className="btn-primary"
                            onClick={() => setApplyJobId(job.id)}
                            style={{ padding: '8px 20px', fontSize: 13 }}
                          >
                            Apply Direct
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, color: '#737373', fontSize: 13, flexWrap: 'wrap' }}>
                      {job.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MapPin size={14} /> {job.location}
                        </div>
                      )}
                      {job.is_remote && (
                        <span style={{ background: '#1a1a1a', color: '#10b981', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          Remote
                        </span>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <DollarSign size={14} />
                          {job.salary_min ? `$${(job.salary_min / 1000).toFixed(0)}k` : '$0'} - {job.salary_max ? `$${(job.salary_max / 1000).toFixed(0)}k` : '∞'}
                        </div>
                      )}
                    </div>

                    <p style={{ margin: '0 0 16px', fontSize: 14, color: '#d4d4d4', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {job.description}
                    </p>

                    {job.tags && job.tags.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {job.tags.map(tag => (
                          <span key={tag} style={{ padding: '3px 10px', borderRadius: 6, background: '#141414', border: '1px solid #262626', color: '#a3a3a3', fontSize: 12 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Apply Direct Modal */}
        {applyJobId && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14, width: '100%', maxWidth: 460, padding: 28, margin: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Apply Directly</h2>
                <button onClick={() => setApplyJobId(null)} style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              <div style={{ padding: 12, background: '#1a1400', border: '1px solid #422006', color: '#eab308', borderRadius: 8, fontSize: 12, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                <AlertTriangle size={16} /> Applying directly will move this position to 'My Applications'.
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Resume Document (PDF) *</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setApplyResume(e.target.files?.[0] || null)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Cover Note (Optional)</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Brief note to the recruiter..." value={applyNote} onChange={e => setApplyNote(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setApplyJobId(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleApply} disabled={applying || !applyResume}>
                  {applying ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Referral Modal */}
        {referralJobId && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14, width: '100%', maxWidth: 460, padding: 28, margin: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Request Insider Referral</h2>
                <button onClick={() => setReferralJobId(null)} style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Select Referrer *</label>
                <select style={inputStyle} value={selectedOfferId} onChange={e => setSelectedOfferId(e.target.value)}>
                  <option value="" disabled>Select an employee referrer…</option>
                  {offers.filter(o => o.posting_id === referralJobId).map(o => (
                    <option key={o.id} value={o.id}>Referrer {o.referrer_id.substring(0, 6)} ({o.tags.join(', ')})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Resume Document (PDF) *</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={e => setReferralResume(e.target.files?.[0] || null)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Message for Referrer</label>
                <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Introduce yourself..." value={referralNote} onChange={e => setReferralNote(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setReferralJobId(null)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleRequestReferral} disabled={requestingReferral || !referralResume || !selectedOfferId}>
                  {requestingReferral ? 'Sending…' : 'Send Referral Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recruiter Post Job Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflowY: 'auto' }}>
            <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14, width: '100%', maxWidth: 520, padding: 28, margin: 'auto', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Post New Job</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#525252', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 4 }}>Job Title *</label>
                  <input required style={inputStyle} placeholder="e.g. Senior Frontend Engineer" value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 4 }}>Company *</label>
                  <select required style={inputStyle} value={newJob.company_id} onChange={e => setNewJob({...newJob, company_id: e.target.value})}>
                    <option value="" disabled>Select company…</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 4 }}>Description *</label>
                  <textarea required rows={4} style={{ ...inputStyle, resize: 'none' }} placeholder="Job responsibilities and qualifications..." value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 4 }}>Location</label>
                  <input style={inputStyle} placeholder="e.g. San Francisco, CA" value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="is_remote" checked={newJob.is_remote} onChange={e => setNewJob({...newJob, is_remote: e.target.checked})} style={{ width: 16, height: 16 }} />
                  <label htmlFor="is_remote" style={{ fontSize: 13, color: '#fff', cursor: 'pointer' }}>Remote position</label>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting}>Publish Job</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
