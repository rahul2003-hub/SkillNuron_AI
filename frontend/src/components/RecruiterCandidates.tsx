import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, UserRound } from 'lucide-react';
import type { JobPosting } from '../App';
import { getCandidateMatches } from '../services/api';

interface CandidateMatch {
  candidate_id: string;
  name: string;
  email: string;
  location?: string;
  skills: string[];
  resume_score?: number | null;
  experience_years: number;
  match_score: number;
  ai_evaluation?: {
    missing_skills?: string[];
  };
}

export function RecruiterCandidates({ jobs }: { jobs: JobPosting[] }) {
  const [candidates, setCandidates] = useState<CandidateMatch[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobs.length && !jobs.some(job => job.id === selectedJobId)) setSelectedJobId(jobs[0].id);
  }, [jobs, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCandidateMatches(selectedJobId, {
      location: locationFilter,
      minExperience: Number(minExperience) || 0,
    })
      .then(data => {
        if (!cancelled) setCandidates(data.matches || []);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedJobId, locationFilter, minExperience]);

  const ranked = useMemo(() => candidates.filter(candidate =>
    `${candidate.name} ${candidate.email} ${candidate.skills.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ), [candidates, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Top Candidates</h2>
          <p className="text-sm text-base-content/60">Ranked by AI fit for the selected job.</p>
        </div>
        {jobs.length > 0 && <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="select select-bordered">
          {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_12rem_auto]">
        <label className="input input-bordered flex items-center gap-2 bg-base-100">
          <Search className="w-4 h-4 text-base-content/40" />
          <input value={query} onChange={e => setQuery(e.target.value)} className="grow" placeholder="Search candidates or skills" />
        </label>
        <label className="input input-bordered flex items-center gap-2 bg-base-100">
          <MapPin className="w-4 h-4 text-base-content/40" />
          <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="grow" placeholder="Filter by location" />
        </label>
        <input
          type="number"
          min="0"
          max="60"
          value={minExperience}
          onChange={e => setMinExperience(e.target.value)}
          className="input input-bordered bg-base-100"
          placeholder="Min. experience"
        />
        <button
          type="button"
          disabled={!locationFilter && !minExperience}
          onClick={() => { setLocationFilter(''); setMinExperience(''); }}
          className="btn btn-ghost"
        >
          Clear filters
        </button>
      </div>

      {loading ? <div className="flex justify-center py-20"><span className="loading loading-spinner text-primary" /></div> :
        ranked.length === 0 ? <div className="bg-base-100 border border-base-300 rounded-xl py-16 text-center text-base-content/60">No candidates found.</div> :
        <div className="grid md:grid-cols-2 gap-5">{ranked.map(candidate => (
          <article key={candidate.candidate_id} className="bg-base-100 border border-base-300 rounded-xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><UserRound className="w-5 h-5" /></div>
                <div className="min-w-0"><h3 className="font-bold truncate">{candidate.name}</h3><p className="text-sm text-base-content/60 truncate">{candidate.email}</p></div>
              </div>
              <span className="badge badge-primary font-bold">{candidate.match_score}% match</span>
            </div>
            {candidate.location && <p className="text-sm text-base-content/60 flex items-center gap-1"><MapPin className="w-4 h-4" />{candidate.location}</p>}
            <p className="text-sm text-base-content/60">{candidate.experience_years} years experience</p>
            <div className="flex flex-wrap gap-2">{candidate.skills.map(skill => <span key={skill} className="badge badge-outline badge-primary">{skill}</span>)}</div>
            <div className="text-sm border-t border-base-300 pt-3">
              <span className="text-base-content/60">Resume score: </span><strong>{candidate.resume_score ?? 'Not analyzed'}</strong>
              <p className="mt-2 text-base-content/60"><span className="font-medium text-base-content">Skill gaps: </span>{candidate.ai_evaluation?.missing_skills?.length ? candidate.ai_evaluation.missing_skills.join(', ') : 'None'}</p>
            </div>
          </article>
        ))}</div>}
    </div>
  );
}
