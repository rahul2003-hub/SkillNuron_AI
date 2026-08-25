import { useState, useEffect } from 'react';
import { FileText, Download, Eye, Loader2, FolderOpen, ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getResumeHistory, getResumeDownloadUrl } from '../services/api';

interface ResumeEntry {
  id: string;
  overall_score: number;
  created_at: string;
  analysis: any;
  resume_path: string | null;
  filename: string | null;
}

interface MyResumesProps {
  userId: string;
  setActiveTab: (tab: any) => void;
}

const scoreBadge = (score: number) =>
  score >= 80 ? 'badge-success' : score >= 60 ? 'badge-warning' : 'badge-error';

const scoreProgress = (score: number) =>
  score >= 80 ? 'progress-success' : score >= 60 ? 'progress-warning' : 'progress-error';

export function MyResumes({ userId, setActiveTab }: MyResumesProps) {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getResumeHistory(userId)
      .then(data => setResumes(data.analyses ?? []))
      .catch(() => setError('Failed to load resume history'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDownload = async (path: string, id: string) => {
    setDownloading(id);
    try {
      const { url } = await getResumeDownloadUrl(path);
      window.open(url, '_blank');
    } catch {
      setError('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <span className="loading loading-spinner loading-lg text-primary" />
        <p className="text-base-content/60 text-sm">Loading your resumes…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-lg grid place-items-center">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="card-title text-lg">My Resumes</h2>
              <p className="text-sm text-base-content/60">{resumes.length} analysis{resumes.length !== 1 ? 'es' : ''} saved</p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setActiveTab('resume-analyzer')}>
            + Analyze New
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Empty State */}
      {resumes.length === 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-16">
            <FileText className="w-16 h-16 text-base-content/20 mb-4" />
            <h3 className="text-lg font-semibold text-base-content/80">No resumes analyzed yet</h3>
            <p className="text-sm text-base-content/50 max-w-sm">Upload and analyze your first resume to get AI-powered scores and improvement tips.</p>
            <button className="btn btn-primary mt-4" onClick={() => setActiveTab('resume-analyzer')}>
              Analyze Your First Resume
            </button>
          </div>
        </div>
      )}

      {/* Resume List */}
      {resumes.map(r => {
        const expanded = expandedId === r.id;
        const analysis = r.analysis;
        const date = new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        return (
          <div key={r.id} className="card bg-base-100 shadow-sm">
            {/* Summary Row */}
            <div
              className="card-body flex-row items-center gap-4 cursor-pointer hover:bg-base-200/50 transition-colors"
              onClick={() => setExpandedId(expanded ? null : r.id)}
            >
              <div className="w-11 h-11 bg-primary/10 rounded-lg grid place-items-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-base-content truncate">{r.filename || 'Resume Analysis'}</p>
                <p className="text-xs text-base-content/50">{date}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className={`badge badge-lg gap-1 font-bold ${scoreBadge(r.overall_score)}`}>
                  {r.overall_score}/100
                </div>

                {r.resume_path && (
                  <button
                    className="btn btn-ghost btn-sm btn-square"
                    title="Download"
                    onClick={e => { e.stopPropagation(); handleDownload(r.resume_path!, r.id); }}
                  >
                    {downloading === r.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Download className="w-4 h-4" />}
                  </button>
                )}

                {expanded ? <ChevronUp className="w-4 h-4 text-base-content/40" /> : <ChevronDown className="w-4 h-4 text-base-content/40" />}
              </div>
            </div>

            {/* Expanded Detail */}
            {expanded && analysis && (
              <div className="px-6 pb-6 pt-0 space-y-5 border-t border-base-200">
                {/* Summary */}
                {analysis.summary && (
                  <p className="text-sm text-base-content/70 pt-4 italic">"{analysis.summary}"</p>
                )}

                {/* Score Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: 'ATS Compatibility', val: analysis.ats_compatibility },
                    { label: 'Content Quality', val: analysis.content_quality },
                    { label: 'Formatting', val: analysis.formatting },
                    { label: 'Keywords', val: analysis.keyword_optimization },
                    { label: 'Impact', val: analysis.impact_score },
                  ].filter(s => s.val != null).map(s => (
                    <div key={s.label} className="bg-base-200/50 rounded-lg p-3">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-base-content/70">{s.label}</span>
                        <span className="font-semibold">{s.val}%</span>
                      </div>
                      <progress className={`progress ${scoreProgress(s.val)} w-full`} value={s.val} max={100} />
                    </div>
                  ))}
                </div>

                {/* Strengths & Improvements */}
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.strengths?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-success mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" /> Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.strengths.map((s: any, i: number) => (
                          <li key={i} className="text-sm text-base-content/70 flex gap-2">
                            <span className="text-success mt-0.5">•</span>
                            <span><strong>{s.title}</strong> — {s.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.improvements?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-warning mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" /> Improvements
                      </h4>
                      <ul className="space-y-1.5">
                        {analysis.improvements.map((imp: any, i: number) => (
                          <li key={i} className="text-sm text-base-content/70 flex gap-2">
                            <span className="text-warning mt-0.5">•</span>
                            <span><strong>{imp.title}</strong> — {imp.description}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Keywords */}
                {(analysis.keywords_present?.length > 0 || analysis.keywords_missing?.length > 0) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-base-content/80">Keywords</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.keywords_present?.map((k: string, i: number) => (
                        <span key={`p${i}`} className="badge badge-sm badge-success badge-outline gap-1">
                          <CheckCircle className="w-3 h-3" />{k}
                        </span>
                      ))}
                      {analysis.keywords_missing?.map((k: string, i: number) => (
                        <span key={`m${i}`} className="badge badge-sm badge-error badge-outline gap-1">
                          <XCircle className="w-3 h-3" />{k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action */}
                <div className="flex justify-end pt-2">
                  <button className="btn btn-primary btn-sm gap-1.5" onClick={() => setActiveTab('resume-analyzer')}>
                    <Eye className="w-4 h-4" /> Re-analyze
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
