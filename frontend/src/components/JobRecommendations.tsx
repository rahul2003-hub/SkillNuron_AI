import { useState, useEffect } from 'react';
import { MapPin, Briefcase, TrendingUp, ExternalLink, Search, Loader2, RefreshCw, CheckCircle2, Send } from 'lucide-react';
import { searchJobs, getAllJobs, applyToJob, getMyApplications } from '../services/api';
import type { JobPosting } from '../App';

const INDIAN_CITIES = [
  "Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi",
  "Noida", "Chennai", "Navi Mumbai", "Kolkata", "Ahmedabad"
];

const TECH_ROLES = [
  "Python Developer", "Full Stack Developer", "Frontend Developer",
  "Backend Developer", "Data Scientist", "ML Engineer",
  "DevOps Engineer", "React Developer", "Java Developer",
  "Software Engineer", "Cloud Engineer", "QA Engineer"
];

interface ExternalJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  posted_date: string;
  type: string;
  source: string;
}

type Source = 'internal' | 'external';

export function JobRecommendations() {
  const [source, setSource] = useState<Source>('internal');

  // Internal (SkillNuron) jobs
  const [internalJobs, setInternalJobs] = useState<JobPosting[]>([]);
  const [isLoadingInternal, setIsLoadingInternal] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  // External (Adzuna) jobs
  const [jobs, setJobs] = useState<ExternalJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<ExternalJob | null>(null);
  const [keywords, setKeywords] = useState('Software Developer');
  const [location, setLocation] = useState('Mumbai');
  const [hasSearched, setHasSearched] = useState(false);

  const loadInternalJobs = async () => {
    setIsLoadingInternal(true);
    try {
      const [jobsData, applicationsData] = await Promise.all([
        getAllJobs(),
        getMyApplications().catch(() => ({ applications: [] })),
      ]);
      setInternalJobs(jobsData.jobs || []);
      setAppliedJobIds(new Set((applicationsData.applications || []).map((a: any) => a.job_id)));
    } catch (err) {
      console.error('Failed to load internal jobs:', err);
    } finally {
      setIsLoadingInternal(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      await applyToJob(jobId);
      setAppliedJobIds(prev => new Set(prev).add(jobId));
    } catch (err: any) {
      alert(err.message || 'Failed to apply');
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setSelectedJob(null);
    setHasSearched(true);
    try {
      const data = await searchJobs(keywords, location, 10);
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError('Could not fetch jobs. Make sure your backend is running.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInternalJobs();
  }, []);

  useEffect(() => {
    if (source === 'external' && !hasSearched) {
      handleSearch();
    }
  }, [source]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-linear-to-r from-primary to-secondary text-primary-content rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-base-100/20 rounded-lg flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-1">Find Your Next Role</h2>
            <p className="opacity-90 text-sm">Browse SkillNuron jobs or live listings from the Indian job market</p>
          </div>
        </div>
      </div>

      {/* Source Toggle */}
      <div role="tablist" className="tabs tabs-boxed bg-base-100 shadow-sm w-fit">
        <button
          role="tab"
          onClick={() => setSource('internal')}
          className={`tab ${source === 'internal' ? 'tab-active' : ''}`}
        >
          SkillNuron Jobs
        </button>
        <button
          role="tab"
          onClick={() => setSource('external')}
          className={`tab ${source === 'external' ? 'tab-active' : ''}`}
        >
          External (Adzuna)
        </button>
      </div>

      {/* --- INTERNAL JOBS --- */}
      {source === 'internal' && (
        <>
          {isLoadingInternal ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : internalJobs.length === 0 ? (
            <div className="text-center py-20 bg-base-100 rounded-xl shadow-sm border border-base-300">
              <Briefcase className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-base-content">No SkillNuron jobs posted yet</h3>
              <p className="text-base-content/60 mt-2">Check the External tab for live listings, or check back soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {internalJobs.map(job => {
                const alreadyApplied = appliedJobIds.has(job.id);
                return (
                  <div key={job.id} className="bg-base-100 rounded-xl p-5 shadow-sm border border-base-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base-content font-medium truncate">{job.title}</h3>
                        <p className="text-primary text-sm">{job.company}</p>
                      </div>
                      <span className="badge badge-primary badge-sm shrink-0 ml-2">SkillNuron</span>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{job.location || 'Remote'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-base-content/70">
                        <Briefcase className="w-3.5 h-3.5 shrink-0" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-success font-medium">
                        ₹ {job.salary || 'Not specified'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.requiredSkills?.slice(0, 5).map((s, i) => (
                        <span key={i} className="badge badge-ghost badge-sm">{s}</span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={alreadyApplied || applyingJobId === job.id}
                      className={`btn btn-sm w-full ${alreadyApplied ? 'btn-success btn-outline' : 'btn-primary'}`}
                    >
                      {applyingJobId === job.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : alreadyApplied ? (
                        <><CheckCircle2 className="w-4 h-4" /> Applied</>
                      ) : (
                        <><Send className="w-4 h-4" /> Apply Now</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* --- EXTERNAL (ADZUNA) JOBS --- */}
      {source === 'external' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-base-100 rounded-xl shadow-sm p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs text-base-content/60 mb-1">Job Role</label>
                <select value={keywords} onChange={(e) => setKeywords(e.target.value)} className="select select-bordered w-full">
                  {TECH_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-base-content/60 mb-1">City</label>
                <select value={location} onChange={(e) => setLocation(e.target.value)} className="select select-bordered w-full">
                  {INDIAN_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={handleSearch} disabled={isLoading} className="btn btn-primary w-full md:w-auto">
                  {isLoading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>) : (<><Search className="w-4 h-4" /> Search Jobs</>)}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="grid md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-base-100 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-2/3" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && hasSearched && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-base-content/70">
                {jobs.length > 0 ? `Found ${jobs.length} jobs for "${keywords}" in ${location}` : `No jobs found for "${keywords}" in ${location}`}
              </p>
              <button onClick={handleSearch} className="flex items-center gap-1 text-sm text-primary hover:text-primary">
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>
          )}

          {!isLoading && jobs.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-base-100 rounded-xl p-5 shadow-sm border border-base-300 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base-content font-medium truncate">{job.title}</h3>
                      <p className="text-primary text-sm">{job.company}</p>
                    </div>
                    <span className="badge badge-success badge-sm shrink-0 ml-2">Live</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-base-content/70">
                      <Briefcase className="w-3.5 h-3.5 shrink-0" /><span>{job.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-success font-medium">₹</span><span className="text-success">{job.salary}</span>
                    </div>
                  </div>

                  <p className="text-xs text-base-content/60 line-clamp-2 mb-4">{job.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-base-content/50">Posted: {job.posted_date}</span>
                    <a
                      href={job.url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Job Detail Modal */}
          {selectedJob && (
            <div className="modal modal-open" onClick={() => setSelectedJob(null)}>
              <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl text-base-content mb-1">{selectedJob.title}</h2>
                    <p className="text-primary text-lg">{selectedJob.company}</p>
                  </div>
                  <span className="badge badge-success">Live on Adzuna</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-base-content/50" />
                    <div><p className="text-xs text-base-content/60">Location</p><p className="text-sm text-base-content">{selectedJob.location}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-base-content/50" />
                    <div><p className="text-xs text-base-content/60">Type</p><p className="text-sm text-base-content">{selectedJob.type}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-success font-medium">₹</span>
                    <div><p className="text-xs text-base-content/60">Salary</p><p className="text-sm text-success font-medium">{selectedJob.salary}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-base-content/50" />
                    <div><p className="text-xs text-base-content/60">Posted</p><p className="text-sm text-base-content">{selectedJob.posted_date}</p></div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-base-content font-medium mb-2">Job Description</h3>
                  <p className="text-sm text-base-content/70 leading-relaxed">{selectedJob.description}</p>
                </div>

                <div className="modal-action mt-0">
                  <button onClick={() => setSelectedJob(null)} className="btn btn-outline flex-1">Close</button>
                  <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1">
                    Apply on Adzuna <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}