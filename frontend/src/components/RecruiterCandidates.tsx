import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, UserRound } from 'lucide-react';
import type { JobPosting } from '../App';
import { getCandidates } from '../services/api';

interface Candidate {
  candidate_id: string;
  name: string;
  email: string;
  location?: string;
  skills: string[];
  resume_score?: number | null;
}

export function RecruiterCandidates({ jobs }: { jobs: JobPosting[] }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCandidates()
      .then(data => setCandidates(data.candidates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectedJob = jobs.find(job => job.id === selectedJobId);
  const ranked = useMemo(() => candidates.map(candidate => {
    const required = selectedJob?.requiredSkills || [];
    const available = new Set(candidate.skills.map(skill => skill.toLowerCase()));
    const matched = required.filter(skill => available.has(skill.toLowerCase()));
    const missing = required.filter(skill => !available.has(skill.toLowerCase()));
    const matchScore = required.length ? Math.round(matched.length / required.length * 100) : candidate.resume_score || 0;
    return { ...candidate, matchScore, missing };
  }).filter(candidate => `${candidate.name} ${candidate.email} ${candidate.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.matchScore - a.matchScore), [candidates, selectedJob, query]);

  if (loading) return <div className="flex justify-center py-20"><span className="loading loading-spinner text-primary" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Top Candidates</h2>
          <p className="text-sm text-base-content/60">Ranked by overlap with the selected job's required skills.</p>
        </div>
        {jobs.length > 0 && <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="select select-bordered">
          {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>}
      </div>

      <label className="input input-bordered flex items-center gap-2 bg-base-100">
        <Search className="w-4 h-4 text-base-content/40" />
        <input value={query} onChange={e => setQuery(e.target.value)} className="grow" placeholder="Search candidates or skills" />
      </label>

      {ranked.length === 0 ? <div className="bg-base-100 border border-base-300 rounded-xl py-16 text-center text-base-content/60">No candidates found.</div> :
        <div className="grid md:grid-cols-2 gap-5">{ranked.map(candidate => (
          <article key={candidate.candidate_id} className="bg-base-100 border border-base-300 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><UserRound className="w-5 h-5" /></div>
                <div className="min-w-0"><h3 className="font-bold truncate">{candidate.name}</h3><p className="text-sm text-base-content/60 truncate">{candidate.email}</p></div>
              </div>
              <span className="badge badge-primary font-bold">{candidate.matchScore}% match</span>
            </div>
            {candidate.location && <p className="text-sm text-base-content/60 flex items-center gap-1"><MapPin className="w-4 h-4" />{candidate.location}</p>}
            <div className="flex flex-wrap gap-2">{candidate.skills.map(skill => <span key={skill} className="badge badge-outline badge-primary">{skill}</span>)}</div>
            <div className="text-sm border-t border-base-300 pt-3">
              <span className="text-base-content/60">Resume score: </span><strong>{candidate.resume_score ?? 'Not analyzed'}</strong>
              {selectedJob && <p className="mt-2 text-base-content/60"><span className="font-medium text-base-content">Skill gaps: </span>{candidate.missing.length ? candidate.missing.join(', ') : 'None'}</p>}
            </div>
          </article>
        ))}</div>}
    </div>
  );
}
