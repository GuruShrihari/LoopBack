import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { Company } from '../../api/company';
import { getCompanies, createCompany } from '../../api/company';
import { useAuthStore } from '../../store/authStore';
import { Building2, Plus, Globe, CheckCircle2 } from 'lucide-react';

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
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Companies</h1>
          <p className="text-gray-400">Discover companies and track their responsiveness.</p>
        </div>
        {user?.role === 'recruiter' && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Add Company
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <div key={company.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                    {company.name}
                    {company.is_verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" title="Verified" />}
                  </h3>
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 transition-colors">
                      <Globe className="w-3 h-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800/50">
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Ghosting Rate</p>
                <p className="text-lg font-semibold text-white">
                  {company.ghosting_rate !== null ? `${(company.ghosting_rate! * 100).toFixed(1)}%` : '--'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Response Time</p>
                <p className="text-lg font-semibold text-white">
                  {company.median_response_hours ? `${company.median_response_hours}h` : '--'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {companies.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No companies found. Be the first to add one!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-white">Add Company</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                <input 
                  type="text" required
                  value={newCompany.name}
                  onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Website URL (Optional)</label>
                <input 
                  type="url"
                  value={newCompany.website}
                  onChange={e => setNewCompany({ ...newCompany, website: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-800 text-gray-300 hover:bg-gray-800 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 font-medium">
                  {isSubmitting ? 'Saving...' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
