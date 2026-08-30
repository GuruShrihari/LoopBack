import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useAuthStore } from '../../store/authStore';
import type { ReferralOffer, ReferralRequest } from '../../api/referral';
import { getReferralOffers, getIncomingRequests, updateReferralRequest, createReferralOffer } from '../../api/referral';
import type { JobPosting } from '../../api/job';
import { getJobs } from '../../api/job';
import { CheckCircle2, XCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReferralHub = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [offers, setOffers] = useState<ReferralOffer[]>([]);
  const [incomingReqs, setIncomingReqs] = useState<ReferralRequest[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Offer Modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [newPostingId, setNewPostingId] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [o, reqs, j] = await Promise.all([
        getReferralOffers(),
        getIncomingRequests(),
        getJobs()
      ]);
      setOffers(o.filter(offer => offer.referrer_id === user?.id));
      setIncomingReqs(reqs);
      setJobs(j);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'candidate' && !user?.employer_id) {
      navigate('/dashboard'); // Candidates without an employer shouldn't be here
      return;
    }
    fetchAll();
  }, [user]);

  const handleUpdateReq = async (id: string, status: string) => {
    try {
      await updateReferralRequest(id, status);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update request');
    }
  };

  const handleCreateOffer = async () => {
    if (!newPostingId) return;
    const selectedJob = jobs.find(j => j.id === newPostingId);
    if (!selectedJob) return;
    setCreating(true);
    try {
      await createReferralOffer({ company_id: selectedJob.company_id, posting_id: newPostingId, tags: newTags });
      setShowOfferModal(false);
      setNewPostingId('');
      setNewTags([]);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create offer');
    } finally {
      setCreating(false);
    }
  };

  const jobTitle = (id: string) => jobs.find(j => j.id === id)?.title || 'Unknown Job';
  const jobReferralLimit = (id: string) => jobs.find(j => j.id === id)?.referral_limit || 5;

  const inputStyle: React.CSSProperties = { width: '100%', background: '#000', color: '#fff', border: '1px solid #262626', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none' };
  const eligibleJobs = jobs.filter(j => user?.employer_id && j.company_id === user.employer_id);

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Referral Hub</h1>
          <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Manage your active referral offers and requests.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowOfferModal(true)}>
          <Plus size={15} /> Offer Referral
        </button>
      </div>

      {!user?.employer_id && (
        <div className="card" style={{ padding: 16, marginBottom: 24, background: '#1c1917', border: '1px solid #44403c', color: '#f59e0b', fontSize: 13 }}>
          ⚠️ <strong>Employer Not Set:</strong> You must select and verify your current employer on the <strong>Dashboard</strong> before you can offer job referrals.
        </div>
      )}

      {loading ? (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>Loading…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Active Offers Section */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid #1a1a1a', paddingBottom: 8 }}>My Active Offers</h2>
            {offers.length === 0 ? (
              <p style={{ color: '#525252', fontSize: 14 }}>You have no active referral offers.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {offers.map(offer => {
                  const limit = jobReferralLimit(offer.posting_id);
                  return (
                    <div key={offer.id} className="card" style={{ padding: 20 }}>
                      <h3 style={{ margin: '0 0 8px', fontSize: 15 }}>{jobTitle(offer.posting_id)}</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#737373', marginBottom: 12 }}>
                        <span>Accepted: {offer.accepted_count} / {limit}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 4, background: '#1a1a1a', color: offer.accepted_count >= limit ? '#ef4444' : '#22c55e' }}>
                          {offer.accepted_count >= limit ? 'Full' : 'Accepting'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {offer.tags.map(t => (
                          <span key={t} style={{ padding: '2px 8px', background: '#000', border: '1px solid #262626', borderRadius: 4, fontSize: 11, color: '#a3a3a3' }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Incoming Requests Section */}
          <section>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: '1px solid #1a1a1a', paddingBottom: 8 }}>Incoming Requests</h2>
            {incomingReqs.length === 0 ? (
              <p style={{ color: '#525252', fontSize: 14 }}>No incoming requests right now.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {incomingReqs.map(req => (
                  <div key={req.id} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>{jobTitle(req.posting_id!)}</h3>
                      <p style={{ margin: '0 0 8px', fontSize: 13, color: '#d4d4d4' }}>Candidate message: {req.message || 'No message provided.'}</p>
                      {req.resume_url && (
                        <a href={`http://localhost:8000${req.resume_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>
                          View Resume
                        </a>
                      )}
                    </div>
                    <div>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleUpdateReq(req.id, 'accepted')} className="btn-primary" style={{ background: '#22c55e', borderColor: '#166534' }}>
                            <CheckCircle2 size={16} /> Accept
                          </button>
                          <button onClick={() => handleUpdateReq(req.id, 'declined')} className="btn-ghost" style={{ color: '#ef4444' }}>
                            <XCircle size={16} /> Decline
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: req.status === 'accepted' ? '#22c55e' : '#ef4444' }}>
                          {req.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Offer Referral for a Job</h2>
            
            {!user?.employer_id ? (
              <div style={{ background: '#1f1300', border: '1px solid #422006', padding: 14, borderRadius: 8, fontSize: 13, color: '#eab308', marginBottom: 16 }}>
                You must set your employer on the <strong>Dashboard</strong> before offering referrals for job openings.
              </div>
            ) : eligibleJobs.length === 0 ? (
              <div style={{ background: '#1f1300', border: '1px solid #422006', padding: 14, borderRadius: 8, fontSize: 13, color: '#eab308', marginBottom: 16 }}>
                No open job postings were found for your current employer company. You can only refer candidates to jobs at your employer.
              </div>
            ) : null}

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>Job Posting (Your Employer) *</label>
              <select style={inputStyle} value={newPostingId} onChange={e => setNewPostingId(e.target.value)} disabled={eligibleJobs.length === 0}>
                <option value="" disabled>Select Job</option>
                {eligibleJobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>Tags (e.g. Backend, Frontend)</label>
              <div style={{ ...inputStyle, display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 44 }}>
                {newTags.map(tag => (
                  <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d4d4d4', fontSize: 12 }}>
                    {tag}
                    <button type="button" onClick={() => setNewTags(newTags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 0, fontSize: 13, lineHeight: 1 }}>x</button>
                  </span>
                ))}
                <input type="text" value={newTagInput}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1, minWidth: 80 }}
                  placeholder="Type and press Enter"
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTagInput.trim()) {
                      e.preventDefault();
                      if (!newTags.includes(newTagInput.trim())) setNewTags([...newTags, newTagInput.trim()]);
                      setNewTagInput('');
                    }
                  }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowOfferModal(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleCreateOffer} disabled={creating || !newPostingId || eligibleJobs.length === 0}>{creating ? 'Creating…' : 'Create Offer'}</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
