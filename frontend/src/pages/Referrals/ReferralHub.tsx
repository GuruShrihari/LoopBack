import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useAuthStore } from '../../store/authStore';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import type { ReferralOffer, ReferralRequest } from '../../api/referral';
import {
  getReferralOffers,
  createReferralOffer,
  createReferralRequest,
  getIncomingRequests,
  getMyRequests,
  updateRequestStatus,
} from '../../api/referral';
import { X, Plus, UserCheck, Send, Inbox, Gift } from 'lucide-react';

type Tab = 'browse' | 'sent' | 'incoming' | 'my-offers';

const statusColor: Record<string, string> = {
  pending: '#eab308',
  accepted: '#22c55e',
  declined: '#ef4444',
  expired: '#525252',
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const ReferralHub = () => {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>('browse');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [offers, setOffers] = useState<ReferralOffer[]>([]);
  const [myRequests, setMyRequests] = useState<ReferralRequest[]>([]);
  const [incoming, setIncoming] = useState<ReferralRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [filterCompany, setFilterCompany] = useState('');
  const [filterTag, setFilterTag] = useState('');

  // create-offer modal
  const [showCreate, setShowCreate] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [newCapacity, setNewCapacity] = useState(3);
  const [creating, setCreating] = useState(false);

  // request-referral modal
  const [requestOffer, setRequestOffer] = useState<ReferralOffer | null>(null);
  const [reqMessage, setReqMessage] = useState('');
  const [requesting, setRequesting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [comps, offs, sent, inc] = await Promise.all([
        getCompanies(),
        getReferralOffers(),
        getMyRequests(),
        getIncomingRequests(),
      ]);
      setCompanies(comps);
      setOffers(offs);
      setMyRequests(sent);
      setIncoming(inc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name || 'Unknown';

  /* ── Filtered offers ──────────────────────────────────────── */
  const filteredOffers = offers.filter((o) => {
    if (filterCompany) {
      const name = companyName(o.company_id).toLowerCase();
      if (!name.includes(filterCompany.toLowerCase())) return false;
    }
    if (filterTag && !o.tags.some((t) => t.toLowerCase().includes(filterTag.toLowerCase()))) return false;
    return true;
  });

  /* ── Handlers ─────────────────────────────────────────────── */
  const handleCreateOffer = async () => {
    if (!newCompanyId) return;
    setCreating(true);
    try {
      await createReferralOffer({ company_id: newCompanyId, tags: newTags, weekly_capacity: newCapacity });
      setShowCreate(false);
      setNewCompanyId('');
      setNewTags([]);
      setNewTagInput('');
      setNewCapacity(3);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create offer');
    } finally {
      setCreating(false);
    }
  };

  const handleRequestReferral = async () => {
    if (!requestOffer) return;
    setRequesting(true);
    try {
      await createReferralRequest(requestOffer.id, { message: reqMessage || undefined });
      setRequestOffer(null);
      setReqMessage('');
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to request referral');
    } finally {
      setRequesting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateRequestStatus(id, status);
      fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update');
    }
  };

  /* ── Shared styles ────────────────────────────────────────── */
  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#000', color: '#fff',
    border: '1px solid #262626', borderRadius: 8,
    padding: '10px 14px', fontSize: 13, outline: 'none',
  };

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
    border: 'none', cursor: 'pointer',
    background: tab === t ? '#1a1a1a' : 'transparent',
    color: tab === t ? '#fff' : '#525252',
    transition: 'all .15s',
  });

  const myOffers = offers.filter((o) => o.referrer_id === user?.id);

  return (
    <Layout>
      {/* Header */}
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Referral Network</h1>
          <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Find referrers or offer your own referrals.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Offer a Referral
        </button>
      </div>

      {/* Tabs */}
      <div className="animate-fade-up" style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button style={tabStyle('browse')} onClick={() => setTab('browse')}><UserCheck size={13} style={{ marginRight: 5 }} />Browse Offers</button>
        <button style={tabStyle('sent')} onClick={() => setTab('sent')}><Send size={13} style={{ marginRight: 5 }} />My Requests</button>
        <button style={tabStyle('incoming')} onClick={() => setTab('incoming')}><Inbox size={13} style={{ marginRight: 5 }} />Incoming</button>
        <button style={tabStyle('my-offers')} onClick={() => setTab('my-offers')}><Gift size={13} style={{ marginRight: 5 }} />My Offers</button>
      </div>

      {loading ? (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>Loading…</div>
      ) : (
        <>
          {/* ── Browse Offers ─────────────────────────────────── */}
          {tab === 'browse' && (
            <div className="stagger">
              {/* Filters */}
              <div className="card animate-fade-up" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  style={{ ...inputStyle, maxWidth: 220 }}
                  placeholder="Filter by company…"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                />
                <input
                  style={{ ...inputStyle, maxWidth: 180 }}
                  placeholder="Filter by tag…"
                  value={filterTag}
                  onChange={(e) => setFilterTag(e.target.value)}
                />
                {(filterCompany || filterTag) && (
                  <button onClick={() => { setFilterCompany(''); setFilterTag(''); }}
                    style={{ background: 'none', border: '1px solid #262626', borderRadius: 6, color: '#737373', padding: '6px 10px', cursor: 'pointer', fontSize: 12 }}>
                    Clear
                  </button>
                )}
                <span style={{ color: '#525252', fontSize: 12, marginLeft: 'auto' }}>{filteredOffers.length} offer{filteredOffers.length !== 1 ? 's' : ''}</span>
              </div>

              {filteredOffers.length === 0 ? (
                <div className="card animate-fade-up" style={{ padding: '48px 24px', textAlign: 'center', color: '#525252' }}>No referral offers found.</div>
              ) : (
                filteredOffers.map((offer) => {
                  const capacityPct = Math.min(100, (offer.current_week_count / offer.weekly_capacity) * 100);
                  const atCap = offer.current_week_count >= offer.weekly_capacity;
                  return (
                    <div key={offer.id} className="card animate-fade-up" style={{ padding: '20px 24px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{companyName(offer.company_id)}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {offer.tags.map((tag) => (
                            <span key={tag} style={{ padding: '3px 10px', borderRadius: 5, background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#737373', fontSize: 12 }}>{tag}</span>
                          ))}
                        </div>
                        {/* Capacity bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, maxWidth: 120, height: 4, borderRadius: 2, background: '#1a1a1a', overflow: 'hidden' }}>
                            <div style={{ width: `${capacityPct}%`, height: '100%', borderRadius: 2, background: atCap ? '#ef4444' : '#22c55e', transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: atCap ? '#ef4444' : '#525252' }}>
                            {offer.current_week_count}/{offer.weekly_capacity} this week
                          </span>
                        </div>
                      </div>
                      <button
                        disabled={atCap || offer.referrer_id === user?.id}
                        onClick={() => setRequestOffer(offer)}
                        style={{
                          padding: '8px 18px', borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 13, cursor: atCap || offer.referrer_id === user?.id ? 'not-allowed' : 'pointer',
                          background: atCap ? '#1a1a1a' : '#fff', color: atCap ? '#525252' : '#000',
                          opacity: offer.referrer_id === user?.id ? 0.4 : 1,
                        }}
                      >
                        {offer.referrer_id === user?.id ? 'Your Offer' : atCap ? 'At Capacity' : 'Request Referral'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── My Sent Requests ──────────────────────────────── */}
          {tab === 'sent' && (
            <div className="stagger">
              {myRequests.length === 0 ? (
                <div className="card animate-fade-up" style={{ padding: '48px 24px', textAlign: 'center', color: '#525252' }}>You haven't sent any referral requests yet.</div>
              ) : (
                myRequests.map((req) => {
                  const offer = offers.find((o) => o.id === req.offer_id);
                  return (
                    <div key={req.id} className="card animate-fade-up" style={{ padding: '20px 24px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{offer ? companyName(offer.company_id) : 'Unknown'}</div>
                        {req.message && <div style={{ color: '#737373', fontSize: 13, marginBottom: 6 }}>"{req.message}"</div>}
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#525252' }}>
                          {req.match_score !== undefined && req.match_score !== null && (
                            <span>Match: {Math.round(req.match_score * 100)}%</span>
                          )}
                          <span>{fmtDate(req.created_at)}</span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 5, fontSize: 12, fontWeight: 600, background: '#0a0a0a', border: `1px solid ${statusColor[req.status] || '#262626'}`, color: statusColor[req.status] || '#737373' }}>
                        {req.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── Incoming Requests ─────────────────────────────── */}
          {tab === 'incoming' && (
            <div className="stagger">
              {incoming.length === 0 ? (
                <div className="card animate-fade-up" style={{ padding: '48px 24px', textAlign: 'center', color: '#525252' }}>No incoming referral requests.</div>
              ) : (
                incoming.map((req) => {
                  const offer = offers.find((o) => o.id === req.offer_id);
                  return (
                    <div key={req.id} className="card animate-fade-up" style={{ padding: '20px 24px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{offer ? companyName(offer.company_id) : 'Unknown'}</div>
                        {req.message && <div style={{ color: '#737373', fontSize: 13, marginBottom: 6 }}>"{req.message}"</div>}
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#525252' }}>
                          {req.match_score !== undefined && req.match_score !== null && (
                            <span>Match: {Math.round(req.match_score * 100)}%</span>
                          )}
                          <span>{fmtDate(req.created_at)}</span>
                        </div>
                      </div>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleUpdateStatus(req.id, 'accepted')}
                            style={{ padding: '7px 14px', borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: '#22c55e', color: '#000' }}>
                            Accept
                          </button>
                          <button onClick={() => handleUpdateStatus(req.id, 'declined')}
                            style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #7f1d1d', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: 'transparent', color: '#ef4444' }}>
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span style={{ padding: '4px 12px', borderRadius: 5, fontSize: 12, fontWeight: 600, background: '#0a0a0a', border: `1px solid ${statusColor[req.status] || '#262626'}`, color: statusColor[req.status] || '#737373' }}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── My Offers ─────────────────────────────────────── */}
          {tab === 'my-offers' && (
            <div className="stagger">
              {myOffers.length === 0 ? (
                <div className="card animate-fade-up" style={{ padding: '48px 24px', textAlign: 'center', color: '#525252' }}>You haven't created any referral offers yet.</div>
              ) : (
                myOffers.map((offer) => {
                  const capacityPct = Math.min(100, (offer.current_week_count / offer.weekly_capacity) * 100);
                  return (
                    <div key={offer.id} className="card animate-fade-up" style={{ padding: '20px 24px', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{companyName(offer.company_id)}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {offer.tags.map((tag) => (
                            <span key={tag} style={{ padding: '3px 10px', borderRadius: 5, background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#737373', fontSize: 12 }}>{tag}</span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, maxWidth: 120, height: 4, borderRadius: 2, background: '#1a1a1a', overflow: 'hidden' }}>
                            <div style={{ width: `${capacityPct}%`, height: '100%', borderRadius: 2, background: capacityPct >= 100 ? '#ef4444' : '#22c55e', transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#525252' }}>
                            {offer.current_week_count}/{offer.weekly_capacity} used
                          </span>
                        </div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: 5, fontSize: 12, fontWeight: 600, background: offer.is_active ? '#052e16' : '#1a1a1a', border: `1px solid ${offer.is_active ? '#166534' : '#262626'}`, color: offer.is_active ? '#22c55e' : '#525252' }}>
                        {offer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ══ Create Offer Modal ════════════════════════════════════ */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="animate-fade-up" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Offer a Referral</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}><X size={16} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Company *</label>
                {companies.length === 0 ? (
                  <div style={{ ...inputStyle, color: '#737373', fontSize: 12 }}>
                    <a href="/companies" style={{ color: '#a3a3a3' }}>Add a company first →</a>
                  </div>
                ) : (
                  <select style={{ ...inputStyle, appearance: 'none' }} value={newCompanyId} onChange={(e) => setNewCompanyId(e.target.value)}>
                    <option value="" disabled>Select…</option>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Tags (press Enter)</label>
                <div style={{ ...inputStyle, display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 44 }}>
                  {newTags.map((tag) => (
                    <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#d4d4d4', fontSize: 12 }}>
                      {tag}
                      <button type="button" onClick={() => setNewTags(newTags.filter((t) => t !== tag))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                  <input type="text" value={newTagInput}
                    style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, flex: 1, minWidth: 80 }}
                    placeholder="e.g. Backend"
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTagInput.trim() && !newTags.includes(newTagInput.trim())) {
                          setNewTags([...newTags, newTagInput.trim()]);
                          setNewTagInput('');
                        }
                      }
                    }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Weekly Capacity</label>
                <input type="number" min={1} style={inputStyle} value={newCapacity} onChange={(e) => setNewCapacity(parseInt(e.target.value) || 1)} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreate(false)}>Cancel</button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={creating || !newCompanyId} onClick={handleCreateOffer}>
                  {creating ? 'Creating…' : 'Create Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Request Referral Modal ════════════════════════════════ */}
      {requestOffer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setRequestOffer(null); }}>
          <div className="animate-fade-up" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14, padding: 28, width: '100%', maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Request Referral</h2>
              <button onClick={() => setRequestOffer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 16, padding: 14, background: '#000', borderRadius: 8, border: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{companyName(requestOffer.company_id)}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {requestOffer.tags.map((tag) => (
                  <span key={tag} style={{ padding: '2px 8px', borderRadius: 4, background: '#1a1a1a', color: '#737373', fontSize: 11 }}>{tag}</span>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Note for the referrer (optional)</label>
              <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Why you'd be a great fit…" value={reqMessage} onChange={(e) => setReqMessage(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setRequestOffer(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={requesting} onClick={handleRequestReferral}>
                {requesting ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

