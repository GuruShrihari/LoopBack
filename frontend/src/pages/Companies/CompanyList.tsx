import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { Company } from '../../api/company';
import { getCompanies, createCompany } from '../../api/company';
import { useAuthStore } from '../../store/authStore';
import { Plus, X } from 'lucide-react';

export const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', website: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const user = useAuthStore((state) => state.user);

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCompany(newCompany.name, newCompany.website);
      setShowModal(false);
      setNewCompany({ name: '', website: '' });
      fetchCompanies();
    } catch (err) {
      alert("Failed to create company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="animate-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Companies</h1>
          <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Discover companies and track their responsiveness.</p>
        </div>
        {user?.role === 'recruiter' && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Company
          </button>
        )}
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {companies.map((company) => (
          <div key={company.id} className="card animate-fade-up" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {company.name}
                  {company.is_verified && (
                    <span style={{ fontSize: 10, background: '#fff', color: '#000', padding: '2px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '.04em' }}>VERIFIED</span>
                  )}
                </h3>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#a3a3a3', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, paddingTop: 16, borderTop: '1px solid #1a1a1a' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#525252', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.04em' }}>Ghosting Rate</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff' }}>
                  {company.ghosting_rate !== null ? `${(company.ghosting_rate! * 100).toFixed(1)}%` : '--'}
                </p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#525252', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.04em' }}>Response Time</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff' }}>
                  {company.median_response_hours ? `${company.median_response_hours}h` : '--'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          No companies found. Be the first to add one!
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="animate-fade-up" style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 400,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Company</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Company Name</label>
                <input required className="input-base" placeholder="e.g. Acme Corp"
                  value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#737373', marginBottom: 6, fontWeight: 500 }}>Website URL (Optional)</label>
                <input type="url" className="input-base" placeholder="https://..."
                  value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
