import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, FileText, MapPin, Search, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { getCandidateProfile, getCandidateResumeUrl, getCandidates } from '../services/api';

interface Candidate {
  candidate_id: string;
  name: string;
  email: string;
  location?: string | null;
  skills: string[];
  resume_score?: number | null;
  experience_years: number;
  education?: string | null;
  primary_role?: string | null;
  resume_filename?: string | null;
  has_resume: boolean;
}

interface CandidateProfile {
  candidate_id: string;
  email: string;
  profile: { name: string; location?: string | null; education?: string | null; experience_years: number; primary_role?: string | null };
  skills: string[];
  resume_score?: number | null;
  resume_filename?: string | null;
  has_resume: boolean;
  resume_analysis?: Record<string, unknown> | null;
}

export function RecruiterCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const delay = setTimeout(() => {
      getCandidates({ search: query, location: locationFilter, minExperience: Number(minExperience) || 0 })
        .then(data => { if (!cancelled) setCandidates(data.candidates || []); })
        .catch(() => { if (!cancelled) toast.error('Unable to load candidates.'); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(delay); };
  }, [query, locationFilter, minExperience]);

  const resultLabel = useMemo(() => `${candidates.length} candidate${candidates.length === 1 ? '' : 's'} found`, [candidates.length]);

  const openProfile = async (candidateId: string) => {
    setProfileLoading(true);
    try {
      const profile = await getCandidateProfile(candidateId);
      if (profile.error) throw new Error(profile.error);
      setSelectedCandidate(profile);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load candidate details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const viewResume = async (candidateId: string) => {
    try {
      const { url } = await getCandidateResumeUrl(candidateId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Resume is unavailable.');
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm text-base-content/60">Browse and manage your talent pool. Candidate scores reflect resume quality, not job fit.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_12rem_auto]">
        <label className="input input-bordered flex items-center gap-2 bg-base-100">
          <Search className="w-4 h-4 text-base-content/40" />
          <input value={query} onChange={e => setQuery(e.target.value)} className="grow" placeholder="Search name, email, or skills" />
        </label>
        <label className="input input-bordered flex items-center gap-2 bg-base-100">
          <MapPin className="w-4 h-4 text-base-content/40" />
          <input value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="grow" placeholder="Filter by location" />
        </label>
        <input type="number" min="0" max="60" value={minExperience} onChange={e => setMinExperience(e.target.value)} className="input input-bordered bg-base-100" placeholder="Min. experience" aria-label="Minimum years of experience" />
        <button type="button" disabled={!query && !locationFilter && !minExperience} onClick={() => { setQuery(''); setLocationFilter(''); setMinExperience(''); }} className="btn btn-ghost">Clear filters</button>
      </div>

      {!loading && <p className="text-sm text-base-content/60">{resultLabel}</p>}
      {loading ? <div className="flex justify-center py-20"><span className="loading loading-spinner text-primary" /></div> :
        candidates.length === 0 ? <div className="bg-base-100 border border-base-300 rounded-xl py-16 text-center text-base-content/60">No candidates match these filters.</div> :
          <div className="grid md:grid-cols-2 gap-4">{candidates.map(candidate => (
            <article key={candidate.candidate_id} className="bg-base-100 border border-base-300 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3 min-w-0"><div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><UserRound className="w-5 h-5" /></div><div className="min-w-0"><h3 className="font-bold truncate">{candidate.name}</h3><p className="text-sm text-base-content/60 truncate">{candidate.email}</p></div></div>
                {candidate.resume_score != null && <span className="badge badge-outline font-bold">Resume {candidate.resume_score}%</span>}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-base-content/60">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{candidate.location || 'Location not specified'}</span>
                <span className="flex items-center gap-1"><BriefcaseBusiness className="w-4 h-4" />{candidate.experience_years} years experience</span>
              </div>
              <div className="flex flex-wrap gap-2">{candidate.skills.slice(0, 6).map(skill => <span key={skill} className="badge border-0 bg-primary/10 text-primary font-medium">{skill}</span>)}</div>
              <button type="button" onClick={() => openProfile(candidate.candidate_id)} className="btn btn-outline btn-sm w-full" disabled={profileLoading}>View profile</button>
            </article>
          ))}</div>}

      {selectedCandidate && <div className="modal modal-open" onClick={() => setSelectedCandidate(null)}>
        <div className="modal-box max-w-2xl" onClick={event => event.stopPropagation()}>
          <button type="button" className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" onClick={() => setSelectedCandidate(null)} aria-label="Close candidate profile"><X className="w-4 h-4" /></button>
          <div className="pr-10"><h3 className="text-xl font-bold">{selectedCandidate.profile.name}</h3><p className="text-sm text-base-content/60">{selectedCandidate.email}</p></div>
          <div className="grid sm:grid-cols-3 gap-3 my-5 text-sm"><div className="rounded-lg bg-base-200 p-3"><p className="text-base-content/60">Location</p><p className="font-medium">{selectedCandidate.profile.location || 'Not specified'}</p></div><div className="rounded-lg bg-base-200 p-3"><p className="text-base-content/60">Experience</p><p className="font-medium">{selectedCandidate.profile.experience_years} years</p></div><div className="rounded-lg bg-base-200 p-3"><p className="text-base-content/60">Resume score</p><p className="font-medium">{selectedCandidate.resume_score ?? 'Not analyzed'}</p></div></div>
          {(selectedCandidate.profile.primary_role || selectedCandidate.profile.education) && <p className="text-sm text-base-content/70 mb-4">{[selectedCandidate.profile.primary_role, selectedCandidate.profile.education].filter(Boolean).join(' · ')}</p>}
          <h4 className="font-semibold mb-2">Skills</h4><div className="flex flex-wrap gap-2 mb-5">{selectedCandidate.skills.length ? selectedCandidate.skills.map(skill => <span key={skill} className="badge border-0 bg-primary/10 text-primary font-medium">{skill}</span>) : <span className="text-sm text-base-content/60">No skills listed.</span>}</div>
          <div className="flex gap-3"><button type="button" className="btn btn-outline flex-1" onClick={() => setSelectedCandidate(null)}>Close</button>{selectedCandidate.has_resume && <button type="button" className="btn btn-primary flex-1" onClick={() => viewResume(selectedCandidate.candidate_id)}><FileText className="w-4 h-4" />View resume</button>}</div>
        </div>
      </div>}
    </div>
  );
}
