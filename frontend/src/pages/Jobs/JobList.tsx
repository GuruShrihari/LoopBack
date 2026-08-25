import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { JobPosting } from '../../api/job';
import { getJobs, createJob } from '../../api/job';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import { applyToJob } from '../../api/application';
import { useAuthStore } from '../../store/authStore';
import { Briefcase, Plus, MapPin, DollarSign, Clock, Search } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const JobList = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newJob, setNewJob] = useState<Partial<JobPosting>>({
    title: '',
    description: '',
    company_id: '',
    location: '',
    is_remote: false,
    salary_min: undefined,
    salary_max: undefined,
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  
  const user = useAuthStore((state) => state.user);

  const fetchData = async () => {
    try {
      const [jobsData, compsData] = await Promise.all([getJobs(), getCompanies()]);
      setJobs(jobsData);
      setCompanies(compsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createJob(newJob);
      setShowModal(false);
      setNewJob({ title: '', description: '', company_id: '', location: '', is_remote: false, tags: [] });
      fetchData();
    } catch (err) {
      alert("Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCompanyName = (id: string) => {
    return companies.find(c => c.id === id)?.name || 'Unknown Company';
  };

  const handleApply = async (jobId: string) => {
    try {
      await applyToJob(jobId);
      alert("Successfully applied to this position!");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to apply");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Job Board</h1>
          <p className="text-gray-400">Find and apply to positions tracked by LoopBack.</p>
        </div>
        {user?.role === 'recruiter' && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-lg group flex flex-col md:flex-row gap-6 items-start md:items-center">
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {job.title}
                </h3>
                {job.is_remote && (
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                    Remote
                  </span>
                )}
              </div>
              
              <div className="text-lg text-gray-300 font-medium mb-4">
                {getCompanyName(job.company_id)}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {job.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                )}
                {(job.salary_min || job.salary_max) && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    {job.salary_min ? `$${(job.salary_min/1000).toFixed(0)}k` : ''} 
                    {job.salary_min && job.salary_max ? ' - ' : ''}
                    {job.salary_max ? `$${(job.salary_max/1000).toFixed(0)}k` : ''}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDate(job.created_at)}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 md:items-end md:max-w-[30%]">
              <div className="flex flex-wrap gap-2 md:justify-end">
                {job.tags.slice(0, 4).map(tag => (
                  <span key={tag} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-lg border border-gray-700">
                    {tag}
                  </span>
                ))}
              </div>
              
              {user?.role === 'candidate' && (
                <button 
                  onClick={() => handleApply(job.id)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 w-full md:w-auto"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        ))}
        
        {jobs.length === 0 && (
          <div className="py-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl">
            No active jobs found. Check back later!
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-2xl shadow-2xl my-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Post a New Job</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Job Title</label>
                  <input 
                    type="text" required
                    value={newJob.title}
                    onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Company</label>
                  {companies.length === 0 ? (
                    <div className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-orange-400 text-sm flex items-center justify-between">
                      <span>No companies exist yet!</span>
                      <a href="/companies" className="text-indigo-400 hover:text-indigo-300 underline">Add one first</a>
                    </div>
                  ) : (
                    <select 
                      required
                      value={newJob.company_id}
                      onChange={e => setNewJob({ ...newJob, company_id: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>Select a company...</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Job Description</label>
                <textarea 
                  required rows={4}
                  value={newJob.description}
                  onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                  <input 
                    type="text"
                    value={newJob.location}
                    onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={newJob.is_remote}
                      onChange={e => setNewJob({ ...newJob, is_remote: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-800 text-indigo-600 focus:ring-indigo-500 bg-gray-950"
                    />
                    <span className="text-sm font-medium text-gray-300">Remote Position</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Min Salary (USD)</label>
                  <input 
                    type="number"
                    value={newJob.salary_min || ''}
                    onChange={e => setNewJob({ ...newJob, salary_min: parseInt(e.target.value) || undefined })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Max Salary (USD)</label>
                  <input 
                    type="number"
                    value={newJob.salary_max || ''}
                    onChange={e => setNewJob({ ...newJob, salary_max: parseInt(e.target.value) || undefined })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tags (Press Enter)</label>
                <div className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500 transition-all flex flex-wrap gap-2">
                  {newJob.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-indigo-600/20 text-indigo-400 px-2 py-1 rounded text-sm border border-indigo-500/20">
                      {tag}
                      <button type="button" onClick={() => setNewJob({...newJob, tags: newJob.tags?.filter(t => t !== tag)})} className="hover:text-white">&times;</button>
                    </span>
                  ))}
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (tagInput.trim() && !newJob.tags?.includes(tagInput.trim())) {
                          setNewJob({ ...newJob, tags: [...(newJob.tags || []), tagInput.trim()] });
                          setTagInput('');
                        }
                      }
                    }}
                    className="flex-1 bg-transparent text-white outline-none min-w-[100px]"
                    placeholder="e.g. React, Python"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 px-4 rounded-xl border border-gray-800 text-gray-300 hover:bg-gray-800 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 font-medium">
                  {isSubmitting ? 'Publishing...' : 'Publish Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
