import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { useParams, Link } from 'react-router-dom';
import type { Application } from '../../api/application';
import { getJobApplications, updateApplicationStatus } from '../../api/application';
import { ChevronLeft, FileText, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';

const STATUSES = ['applied', 'screening', 'interviewing', 'offered', 'rejected'];

export const ATSDashboard = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    if (!jobId) return;
    try {
      const data = await getJobApplications(jobId);
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [jobId]);

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      // Optimistically update UI
      setApplications(prev => prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      alert("Failed to update status");
      // Refetch on error to sync state
      fetchApps();
    }
  };

  // Group applications by status for Kanban view
  const appsByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = applications.filter(a => a.status === status);
    return acc;
  }, {} as Record<string, Application[]>);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'applied': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'screening': return <Clock className="w-4 h-4 text-purple-400" />;
      case 'interviewing': return <Calendar className="w-4 h-4 text-yellow-400" />;
      case 'offered': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'applied': return 'border-t-blue-500';
      case 'screening': return 'border-t-purple-500';
      case 'interviewing': return 'border-t-yellow-500';
      case 'offered': return 'border-t-emerald-500';
      case 'rejected': return 'border-t-red-500';
      default: return 'border-t-gray-500';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  const jobTitle = applications.length > 0 ? applications[0].job_title : 'Job Posting';

  return (
    <Layout>
      <div className="mb-8">
        <Link to="/ats" className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-4 w-max transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Back to ATS List
        </Link>
        <h1 className="text-3xl font-bold mb-2">Applicants: {jobTitle}</h1>
        <p className="text-gray-400">Total Applicants: {applications.length}</p>
      </div>

      {applications.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-900 border border-gray-800 rounded-2xl">
          No one has applied to this position yet. Check back later!
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 min-h-[500px]">
          {STATUSES.map(status => (
            <div key={status} className={`flex-shrink-0 w-80 bg-gray-900 border border-gray-800 border-t-4 ${getStatusColor(status)} rounded-2xl flex flex-col`}>
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-gray-200 capitalize">
                  {getStatusIcon(status)}
                  {status}
                </div>
                <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded-full font-medium">
                  {appsByStatus[status].length}
                </span>
              </div>
              
              <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                {appsByStatus[status].map(app => (
                  <div key={app.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4 shadow-sm hover:border-gray-700 transition-colors">
                    <div className="font-medium text-white mb-1 flex items-center justify-between">
                      Applicant
                      <span className="text-xs text-gray-500" title={app.id}>
                        ...{app.id.slice(-4)}
                      </span>
                    </div>
                    {app.cover_note && (
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4 italic">"{app.cover_note}"</p>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-gray-800">
                      <select 
                        className="w-full bg-gray-900 text-sm text-gray-300 border border-gray-700 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none"
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};
