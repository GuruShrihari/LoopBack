import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import type { InterviewIntel } from '../../api/intel';
import { getIntelFeed } from '../../api/intel';
import { Target, MessageSquare } from 'lucide-react';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const DifficultyStars = ({ rating }: { rating?: number }) => {
  if (!rating) return <span style={{ color: '#525252', fontSize: 13 }}>N/A</span>;
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} style={{ fontSize: 16, lineHeight: 1, color: star <= rating ? '#fff' : '#2a2a2a' }}>
          ★
        </span>
      ))}
    </div>
  );
};

export const IntelFeed = () => {
  const [intelList, setIntelList] = useState<InterviewIntel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntel = async () => {
      try {
        const data = await getIntelFeed();
        setIntelList(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIntel();
  }, []);

  return (
    <Layout>
      <div className="animate-fade-up" style={{ marginBottom: 32, maxWidth: 800, margin: '0 auto 32px' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em' }}>Interview Intel</h1>
        <p style={{ margin: '6px 0 0', color: '#737373', fontSize: 14 }}>Verified, anonymous interview experiences shared by the LoopBack community.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <div className="spinner" />
        </div>
      ) : intelList.length === 0 ? (
        <div className="card animate-fade-up" style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px', textAlign: 'center', color: '#525252' }}>
          <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 16 }} />
          <p style={{ margin: 0, fontSize: 15 }}>No interview intel has been shared yet.</p>
          <p style={{ margin: '6px 0 0', fontSize: 13 }}>Apply for a job and share your experience to help the community!</p>
        </div>
      ) : (
        <div className="stagger" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {intelList.map(intel => (
            <div key={intel.id} className="card animate-fade-up" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #1a1a1a', paddingBottom: 20, marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#fff' }}>{intel.company_name}</h2>
                  <div style={{ color: '#a3a3a3', fontWeight: 500, fontSize: 14, marginBottom: 12 }}>{intel.job_title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#525252' }}>
                    <span style={{ background: '#1a1a1a', padding: '2px 8px', borderRadius: 4, color: '#d4d4d4', fontWeight: 500 }}>
                      {intel.is_anonymous ? 'Anonymous Applicant' : 'Verified Applicant'}
                    </span>
                    <span>•</span>
                    <span>{formatDate(intel.created_at)}</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#000', padding: 12, borderRadius: 10, border: '1px solid #1a1a1a', minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#737373', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>Difficulty</span>
                    <DifficultyStars rating={intel.overall_difficulty} />
                  </div>
                  {intel.outcome && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 12, color: '#737373', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>Outcome</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '.04em',
                        background: intel.outcome.toLowerCase() === 'offered' ? 'rgba(255,255,255,.16)' :
                                    intel.outcome.toLowerCase() === 'rejected' ? 'rgba(80,0,0,.4)' : 'rgba(255,255,255,.06)',
                        color: intel.outcome.toLowerCase() === 'offered' ? '#fff' :
                               intel.outcome.toLowerCase() === 'rejected' ? '#f87171' : '#a3a3a3',
                        border: '1px solid',
                        borderColor: intel.outcome.toLowerCase() === 'offered' ? '#888' :
                                     intel.outcome.toLowerCase() === 'rejected' ? '#7f1d1d' : '#2a2a2a',
                      }}>
                        {intel.outcome}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Target size={16} color="#737373" /> Interview Rounds
                </h3>
                {intel.rounds && intel.rounds.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {intel.rounds.map((round: any, idx: number) => (
                      <div key={idx} style={{ background: '#000', border: '1px solid #1a1a1a', borderRadius: 10, padding: 16 }}>
                        <h4 style={{ margin: '0 0 8px', fontWeight: 600, color: '#d4d4d4', fontSize: 14 }}>
                          Round {idx + 1}: {round.title}
                        </h4>
                        <p style={{ margin: 0, color: '#a3a3a3', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                          {round.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#525252', fontSize: 13, fontStyle: 'italic' }}>No round details provided.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};
