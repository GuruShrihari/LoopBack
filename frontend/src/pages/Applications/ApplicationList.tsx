import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { Application } from '../../api/application';
import { getMyApplications } from '../../api/application';
import { FileText, Building2, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getStatusBadge = (status: string) => {
  const styles: Record<string, { bg: string, text: string, icon: any }> = {
    'applied': { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: FileText },
    'screening': { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: Clock },
    'interviewing': { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Calendar },
    'offered': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: CheckCircle },
    'rejected': { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle },
    'withdrawn': { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: XCircle },
  };

  const config = styles[status] || styles['applied'];
  const Icon = config.icon;
  
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} border border-current opacity-80 w-max`}>
      <Icon className="w-3.5 h-3.5" />
      {status.toUpperCase()}
    </span>
  );
};

export const ApplicationList = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const data = await getMyApplications();
        setApplications(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
        <p className="text-gray-400">Track the status of your active job applications.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl">
          You haven't applied to any jobs yet. Go to the Job Board to find your next role!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors shadow-lg flex flex-col h-full">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1 truncate" title={app.job_title}>
                    {app.job_title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Building2 className="w-4 h-4" />
                    {app.company_name}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                {getStatusBadge(app.status)}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-800/50 flex flex-col gap-2 text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Applied</span>
                  <span className="text-gray-300 font-medium">{formatDate(app.applied_at)}</span>
                </div>
                {app.last_employer_response_at && (
                  <div className="flex justify-between">
                    <span>Last Response</span>
                    <span className="text-gray-300 font-medium">{formatDate(app.last_employer_response_at)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};
