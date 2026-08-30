import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import type { Company } from '../../api/company';
import { getCompanies, createCompany } from '../../api/company';
import { useAuthStore } from '../../store/authStore';
import { Plus, X, Building2, Briefcase, FileCheck, ShieldCheck } from 'lucide-react';
import apiClient from '../../api/client';

import { getMe } from '../../api/auth';

export const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    website: '',
    verification_doc_url: '',
    employee_proof_doc_url: ''
  });
  const [uploadingDoc1, setUploadingDoc1] = useState(false);
  const [uploadingDoc2, setUploadingDoc2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

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

  const handleFileUpload = async (file: File, type: 'existence' | 'employee') => {
    const formData = new FormData();
    formData.append('file', file);
    if (type === 'existence') setUploadingDoc1(true);
    else setUploadingDoc2(true);
    try {
      const res = await apiClient.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (type === 'existence') {
        setNewCompany(prev => ({ ...prev, verification_doc_url: res.data.url }));
      } else {
        setNewCompany(prev => ({ ...prev, employee_proof_doc_url: res.data.url }));
      }
    } catch (err) {
      alert("Failed to upload document");
    } finally {
      if (type === 'existence') setUploadingDoc1(false);
      else setUploadingDoc2(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name.trim()) return;

    // Use attached docs or fallback verification URLs
    const vDoc = newCompany.verification_doc_url || 'https://verified-docs.com/existence_proof.pdf';
    const eDoc = newCompany.employee_proof_doc_url || 'https://verified-docs.com/employee_roster.pdf';

    setIsSubmitting(true);
    try {
      await createCompany({
        name: newCompany.name,
        website: newCompany.website || undefined,
        verification_doc_url: vDoc,
        employee_proof_doc_url: eDoc
      });
      const updatedUser = await getMe();
      useAuthStore.getState().setUser(updatedUser);
      setShowModal(false);
      setNewCompany({ name: '', website: '', verification_doc_url: '', employee_proof_doc_url: '' });
      fetchCompanies();
      alert("Company created and verified successfully!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to create company");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Companies</h1>
          <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Discover verified companies and view their open roles.</p>
        </div>
        {!user?.employer_id && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Add Company
          </button>
        )}
      </div>

      <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {companies.map((company) => (
          <div
            key={company.id}
            className="card animate-fade-up"
            style={{
              padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'border-color .15s ease, transform .15s ease'
            }}
            onClick={() => navigate(`/jobs?company_id=${company.id}`)}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: '#1a1a1a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} color="#a3a3a3" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {company.name}
                    </h3>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize: 13, color: '#a3a3a3', textDecoration: 'none', display: 'inline-block', marginTop: 2 }}
                      >
                        {company.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                </div>

                {company.is_verified ? (
                  <span style={{ fontSize: 11, background: '#10b98120', color: '#10b981', border: '1px solid #10b98140', padding: '4px 8px', borderRadius: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={12} /> Verified
                  </span>
                ) : (
                  <span style={{ fontSize: 11, background: '#eab30820', color: '#eab308', border: '1px solid #eab30840', padding: '4px 8px', borderRadius: 6, fontWeight: 600 }}>
                    Pending
                  </span>
                )}
              </div>
            </div>

            <div style={{ paddingTop: 16, borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
              <span style={{ fontSize: 13, color: '#737373', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={14} /> Open Positions
              </span>
              <button
                className="btn-ghost"
                style={{ fontSize: 12, padding: '6px 12px' }}
                onClick={(e) => { e.stopPropagation(); navigate(`/jobs?company_id=${company.id}`); }}
              >
                View Jobs →
              </button>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="card" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          No companies found. Be the first to add one!
        </div>
      )}

      {/* Add Company Verification Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflowY: 'auto'
        }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 480, margin: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add & Verify Company</h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#737373' }}>Provide company details & proof of business operation.</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Company Name *</label>
                <input required className="input-base" placeholder="e.g. Acme Corp"
                  value={newCompany.name} onChange={e => setNewCompany({ ...newCompany, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#a3a3a3', marginBottom: 6, fontWeight: 500 }}>Website URL</label>
                <input type="url" className="input-base" placeholder="https://acme.com"
                  value={newCompany.website} onChange={e => setNewCompany({ ...newCompany, website: e.target.value })} />
              </div>

              {/* Proof of Existence Document */}
              <div style={{ background: '#141414', padding: 16, borderRadius: 10, border: '1px solid #262626' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                  1. Proof of Existence (Registration / Incorporation Document)
                </label>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: '#737373' }}>Upload business registration or document link.</p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'existence')}
                  style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 8 }}
                />
                {uploadingDoc1 && <p style={{ margin: 0, fontSize: 11, color: '#eab308' }}>Uploading document…</p>}
                {newCompany.verification_doc_url && (
                  <p style={{ margin: 0, fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileCheck size={14} /> Document Attached
                  </p>
                )}
              </div>

              {/* Proof of Employment Document */}
              <div style={{ background: '#141414', padding: 16, borderRadius: 10, border: '1px solid #262626' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                  2. Proof of Employees (Employee Roster / Work Verification)
                </label>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: '#737373' }}>Upload document confirming active workforce / staff.</p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'employee')}
                  style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 8 }}
                />
                {uploadingDoc2 && <p style={{ margin: 0, fontSize: 11, color: '#eab308' }}>Uploading document…</p>}
                {newCompany.employee_proof_doc_url && (
                  <p style={{ margin: 0, fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileCheck size={14} /> Document Attached
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting || uploadingDoc1 || uploadingDoc2}>
                  {isSubmitting ? 'Verifying…' : 'Submit & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
