import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { JobPosting } from '../../api/job';
import { getMyJobs } from '../../api/job';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import { Link } from 'react-router-dom';
import { Users, Clock, MapPin, ChevronRight } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ATSList = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, compsData] = await Promise.all([getMyJobs(), getCompanies()]);
        setJobs(jobsData);
        setCompanies(compsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCompanyName = (id: string) => {
    return companies.find(c => c.id === id)?.name || 'Unknown Company';
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ATS Dashboard</h1>
        <p className="text-gray-400">Select a job posting to review applicants.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl">
          You haven't posted any jobs yet. Head to the Job Board to post your first position!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Link 
              key={job.id} 
              to={`/ats/${job.id}`}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all shadow-lg flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                    {job.title}
                  </h3>
                  <div className="text-sm text-gray-400">
                    {getCompanyName(job.company_id)}
                  </div>
                </div>
                <ChevronRight className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
              </div>

              <div className="mt-auto pt-4 border-t border-gray-800/50 flex flex-col gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Posted {formatDate(job.created_at)}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location} {job.is_remote ? '(Remote)' : ''}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-indigo-400 font-medium">
                  <Users className="w-4 h-4" />
                  <span>Review Candidates</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};
