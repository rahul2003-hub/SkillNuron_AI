import { useEffect, useState } from 'react';
import { MapPin, Briefcase, TrendingUp, ExternalLink, Search, Loader2, RefreshCw, CheckCircle2, Send, SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { applyToJob, getJobRecommendations } from '../services/api';
import type { RecommendedJob } from '../services/api';

export function JobRecommendations() {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumbers, setPageNumbers] = useState<(number | string)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);
  const [searchText, setSearchText] = useState('');
  const [technology, setTechnology] = useState('');
  const [location, setLocation] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [matchProfile, setMatchProfile] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<{ types: string[]; canMatchProfile: boolean }>({
    types: ['Full-time', 'Part-time', 'Internship'],
    canMatchProfile: false,
  });

  const loadJobs = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getJobRecommendations({
        source: sourceFilter, search: searchText, technology,
        job_type: typeFilter, location, company: companyFilter,
        status: statusFilter, match_profile: matchProfile,
        page, limit: 12,
      });
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
      setPageNumbers(data.page_numbers || []);
      setOptions(data.options || options);
    } catch (err) {
      setError('Could not fetch jobs. Make sure your backend is running.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      await applyToJob(jobId);
      setJobs(previous => previous.map(job => job.id === jobId ? { ...job, applied: true } : job));
    } catch (err: any) {
      alert(err.message || 'Failed to apply');
    } finally {
      setApplyingJobId(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchText, technology, location, sourceFilter, typeFilter, companyFilter, statusFilter, matchProfile]);

  useEffect(() => {
    const timer = window.setTimeout(loadJobs, 300);
    return () => window.clearTimeout(timer);
  }, [searchText, technology, location, sourceFilter, typeFilter, companyFilter, statusFilter, matchProfile, page]);

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-primary to-secondary text-primary-content rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-base-100/20 rounded-lg flex items-center justify-center shrink-0"><Briefcase className="w-6 h-6" /></div>
          <div><h2 className="text-2xl mb-1">Find Your Next Role</h2><p className="opacity-90 text-sm">Browse SkillNuron jobs and live listings from the Indian job market</p></div>
        </div>
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <label className="input input-bordered flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-base-content/50" />
            <input value={searchText} onChange={event => setSearchText(event.target.value)} className="grow" placeholder="Search by title, company, or keywords..." />
          </label>
          <label className={`btn btn-outline gap-2 ${matchProfile ? 'btn-primary' : ''} ${!options.canMatchProfile ? 'btn-disabled' : ''}`}>
            <Sparkles className="w-4 h-4" /> Match with Profile
            <input type="checkbox" checked={matchProfile} disabled={!options.canMatchProfile} onChange={event => setMatchProfile(event.target.checked)} className="toggle toggle-sm" />
          </label>
          <button onClick={() => setShowFilters(previous => !previous)} className={`btn btn-outline gap-2 ${showFilters ? 'btn-primary' : ''}`}>
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-4 border-t border-base-300">
            <select value={sourceFilter} onChange={event => setSourceFilter(event.target.value)} className="select select-bordered w-full" aria-label="Job source">
              <option value="all">All Jobs</option>
              <option value="internal">SkillNuron Jobs</option>
              <option value="external">External Jobs</option>
            </select>
            <input value={technology} onChange={event => setTechnology(event.target.value)} className="input input-bordered w-full" placeholder="Technologies" aria-label="Technology" />
            <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)} className="select select-bordered w-full" aria-label="Job type">
              <option value="">All Job Types</option>
              {options.types.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <input value={location} onChange={event => setLocation(event.target.value)} className="input input-bordered w-full" placeholder="Location" aria-label="Location" />
            <input value={companyFilter} onChange={event => setCompanyFilter(event.target.value)} className="input input-bordered w-full" placeholder="Company" aria-label="Company" />
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="select select-bordered w-full" aria-label="Application status">
              <option value="">All Status</option>
              <option value="applied">Applied</option>
              <option value="not-applied">Not Applied</option>
            </select>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      {isLoading && (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, index) => <div key={index} className="bg-base-100 rounded-xl p-5 shadow-sm space-y-3"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-full" /></div>)}
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-base-content/70">Showing {jobs.length} of {total} jobs</p>
            <button onClick={loadJobs} className="flex items-center gap-1 text-sm text-primary hover:text-primary"><RefreshCw className="w-3 h-3" /> Refresh</button>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-20 bg-base-100 rounded-xl shadow-sm border border-base-300">
              <Briefcase className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-base-content">No jobs match these filters</h3>
              <p className="text-base-content/60 mt-2">Try another role or city.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.map(job => {
                const isInternal = job.source === 'internal';
                return (
                  <div key={`${job.source}-${job.id}`} onClick={() => !isInternal && setSelectedJob(job)} className={`bg-base-100 rounded-xl p-5 shadow-sm border border-base-300 hover:shadow-md ${isInternal ? '' : 'hover:border-primary/40 cursor-pointer'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0"><h3 className="text-base-content font-medium truncate">{job.title}</h3><p className="text-primary text-sm">{job.company}</p></div>
                      <span className={`badge badge-sm shrink-0 ml-2 ${isInternal ? 'badge-primary' : 'badge-success'}`}>{job.sourceLabel}</span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/70"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{job.location || 'Remote'}</span></div>
                      <div className="flex items-center gap-2 text-sm text-base-content/70"><Briefcase className="w-3.5 h-3.5 shrink-0" /><span>{job.type}</span></div>
                      <div className="text-sm text-success font-medium">{job.salary || 'Not specified'}</div>
                    </div>
                    <p className="text-xs text-base-content/60 line-clamp-2 mb-3">{job.description}</p>
                    {job.requiredSkills.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{job.requiredSkills.slice(0, 5).map((skill, index) => <span key={index} className="badge badge-ghost badge-sm">{skill}</span>)}</div>}
                    {isInternal ? (
                      <button onClick={() => handleApply(job.id)} disabled={job.applied || applyingJobId === job.id} className={`btn btn-sm w-full ${job.applied ? 'btn-success btn-outline' : 'btn-primary'}`}>
                        {applyingJobId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : job.applied ? <><CheckCircle2 className="w-4 h-4" /> Applied</> : <><Send className="w-4 h-4" /> Apply Now</>}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between"><span className="text-xs text-base-content/50">Posted: {job.postedLabel}</span><a href={job.url} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()} className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium">Apply <ExternalLink className="w-3 h-3" /></a></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center pt-8 pb-4">
              <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl border border-base-300 bg-base-100 shadow-lg">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-base-200 hover:bg-base-300 text-base-content/60 hover:text-base-content disabled:opacity-20 disabled:hover:bg-base-200 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {pageNumbers.map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-sm text-base-content/40 font-medium">...</span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      onClick={() => setPage(Number(item))}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                        page === item
                          ? 'bg-primary text-primary-content shadow-md scale-105'
                          : 'bg-base-200 hover:bg-base-300 text-base-content/80 hover:text-base-content'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-base-200 hover:bg-base-300 text-base-content/60 hover:text-base-content disabled:opacity-20 disabled:hover:bg-base-200 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selectedJob && (
        <div className="modal modal-open" onClick={() => setSelectedJob(null)}>
          <div className="modal-box max-w-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between mb-4"><div><h2 className="text-2xl text-base-content mb-1">{selectedJob.title}</h2><p className="text-primary text-lg">{selectedJob.company}</p></div><span className="badge badge-success">Live on Adzuna</span></div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-base-content/50" /><div><p className="text-xs text-base-content/60">Location</p><p className="text-sm text-base-content">{selectedJob.location}</p></div></div>
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-base-content/50" /><div><p className="text-xs text-base-content/60">Type</p><p className="text-sm text-base-content">{selectedJob.type}</p></div></div>
              <div><p className="text-xs text-base-content/60">Salary</p><p className="text-sm text-success font-medium">{selectedJob.salary}</p></div>
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-base-content/50" /><div><p className="text-xs text-base-content/60">Posted</p><p className="text-sm text-base-content">{selectedJob.postedLabel}</p></div></div>
            </div>
            <div className="mb-6"><h3 className="text-base-content font-medium mb-2">Job Description</h3><p className="text-sm text-base-content/70 leading-relaxed">{selectedJob.description}</p></div>
            <div className="modal-action mt-0"><button onClick={() => setSelectedJob(null)} className="btn btn-outline flex-1">Close</button><a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1">Apply on Adzuna <ExternalLink className="w-4 h-4" /></a></div>
          </div>
        </div>
      )}
    </div>
  );
}
