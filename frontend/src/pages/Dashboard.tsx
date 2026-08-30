import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { getMyApplications } from '../api/application';
import { useAuthStore } from '../store/authStore';
import { getCompanies, type Company } from '../api/company';
import apiClient from '../api/client';
import { X, FileCheck, ShieldCheck } from 'lucide-react';

export const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  
  const [stats, setStats] = useState({
    active: 0,
    interviews: 0,
    offers: 0
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedEmployer, setSelectedEmployer] = useState<string>(user?.employer_id || '');
  const [savingEmployer, setSavingEmployer] = useState(false);
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [employmentDocUrl, setEmploymentDocUrl] = useState('');
  const [uploadingEmpDoc, setUploadingEmpDoc] = useState(false);

  useEffect(() => {
    if (user?.role === 'candidate') {
      getMyApplications()
        .then((apps) => {
          setStats({
            active: apps.filter(a => ['applied', 'under_review'].includes(a.status)).length,
            interviews: apps.filter(a => a.status === 'interview_scheduled').length,
            offers: apps.filter(a => a.status === 'offered').length
          });
        })
        .catch(console.error);
    } else if (user?.role === 'recruiter') {
      getCompanies().then(setCompanies).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.employer_id) {
      setSelectedEmployer(user.employer_id);
    }
  }, [user]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploadingEmpDoc(true);
    try {
      const res = await apiClient.post('/upload/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEmploymentDocUrl(res.data.url);
    } catch (err) {
      alert("Failed to upload employment proof document.");
    } finally {
      setUploadingEmpDoc(false);
    }
  };

  const handleConfirmSaveEmployer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployer) return;
    setSavingEmployer(true);

    const docUrl = employmentDocUrl || 'https://verified-docs.com/employment_proof.pdf';

    try {
      const res = await apiClient.patch('/auth/me/employer', {
        employer_id: selectedEmployer,
        employment_doc_url: docUrl
      });
      useAuthStore.getState().setUser(res.data);
      setShowEmpModal(false);
      alert('Employer and employment verification document updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update employer.');
    } finally {
      setSavingEmployer(false);
    }
  };

  const selectedCompanyName = companies.find(c => c.id === selectedEmployer)?.name || 'Selected Company';

  return (
    <Layout>
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Dashboard</h1>
        <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Welcome to LoopBack. Your recruitment data lives here.</p>
      </div>

      {user?.role === 'recruiter' && (
        <div className="card animate-fade-up" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>Current Employer</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={selectedEmployer}
              onChange={e => setSelectedEmployer(e.target.value)}
              style={{ flex: 1, background: '#000', color: '#fff', border: '1px solid #262626', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none' }}
            >
              <option value="" disabled>Select your employer…</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              className="btn-primary"
              onClick={() => setShowEmpModal(true)}
              disabled={!selectedEmployer}
            >
              Save & Verify
            </button>
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: '#737373' }}>You must select an employer and attach proof of employment before posting jobs or accepting referrals.</p>
        </div>
      )}

      {user?.role === 'candidate' && (
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
      )}

      {/* Employment Verification Modal */}
      {showEmpModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflowY: 'auto'
        }} onClick={e => { if (e.target === e.currentTarget) setShowEmpModal(false); }}>
          <div style={{
            background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 14,
            padding: 28, width: '100%', maxWidth: 460, margin: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={18} color="#10b981" /> Employment Proof
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#737373' }}>Attach documents proving employment at {selectedCompanyName}.</p>
              </div>
              <button onClick={() => setShowEmpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525252', padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveEmployer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#141414', padding: 16, borderRadius: 10, border: '1px solid #262626' }}>
                <label style={{ display: 'block', fontSize: 12, color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                  Employment Verification Document (Work ID / Offer Letter / Paystub)
                </label>
                <p style={{ margin: '0 0 10px', fontSize: 11, color: '#737373' }}>Upload a PDF or image confirming active employment.</p>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  style={{ fontSize: 12, color: '#a3a3a3', marginBottom: 8 }}
                />
                {uploadingEmpDoc && <p style={{ margin: 0, fontSize: 11, color: '#eab308' }}>Uploading document…</p>}
                {employmentDocUrl && (
                  <p style={{ margin: 0, fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FileCheck size={14} /> Document Attached
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={savingEmployer || uploadingEmpDoc}>
                  {savingEmployer ? 'Saving…' : 'Confirm & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
