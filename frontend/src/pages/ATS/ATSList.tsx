import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { JobPosting } from '../../api/job';
import { getMyJobs } from '../../api/job';
import type { Company } from '../../api/company';
import { getCompanies } from '../../api/company';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const ATSList = () => {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, companiesData] = await Promise.all([
          getMyJobs(),
          getCompanies()
        ]);
        setJobs(jobsData);
        setCompanies(companiesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCompanyName = (companyId: string) => {
    return companies.find(c => c.id === companyId)?.name || 'Unknown Company';
  };

  return (
    <Layout>
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Applicant Tracking (ATS)</h1>
        <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Select a job posting to view candidates and manage hiring pipelines.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="spinner" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card animate-fade-up" style={{ padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          You haven't posted any jobs yet. Go to the Job Board to post a new job!
        </div>
      ) : (
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {jobs.map((job) => (
            <Link 
              key={job.id} 
              to={`/ats/${job.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card card-interactive animate-fade-up" style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#fff' }}>{job.title}</h3>
                  <ArrowRight size={16} color="#737373" />
                </div>
                
                <div style={{ color: '#a3a3a3', fontSize: 13, marginBottom: 16 }}>
                  {getCompanyName(job.company_id)}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                  {job.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} style={{
                      padding: '2px 8px', borderRadius: 4,
                      background: '#1a1a1a', color: '#737373',
                      fontSize: 11, fontWeight: 500
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#525252' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={12} /> {job.location || (job.is_remote ? 'Remote' : 'Unspecified')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {formatDate(job.created_at)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
};
