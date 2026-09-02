import { useEffect, useRef, useState } from 'react';
import { MapPin, Briefcase, TrendingUp, ExternalLink, Search, Loader2, RefreshCw, CheckCircle2, Send, SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight, Upload, X } from 'lucide-react';
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
  const [applicationJob, setApplicationJob] = useState<RecommendedJob | null>(null);
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [applicationError, setApplicationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const applicationResumeRef = useRef<HTMLInputElement>(null);
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

  const handleApply = async () => {
    if (!applicationJob) return;
    if (!resume) {
      setApplicationError('Please upload your resume before submitting.');
      return;
    }
    const jobId = applicationJob.id;
    setApplyingJobId(jobId);
    setApplicationError('');
    try {
      const result = await applyToJob(jobId, { resume, coverLetter, expectedSalary });
      setJobs(previous => previous.map(job => job.id === jobId ? { ...job, applied: true } : job));
      setApplicationJob(null);
      setResume(null);
      setCoverLetter('');
      setExpectedSalary('');
      setSuccessMessage(result.message || 'Applied successfully');
    } catch (err: any) {
      setApplicationError(err.message || 'Failed to apply');
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
                  <div key={`${job.source}-${job.id}`} onClick={() => setSelectedJob(job)} className="bg-base-100 rounded-xl p-5 shadow-sm border border-base-300 hover:shadow-md hover:border-primary/40 cursor-pointer">
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
                      <button onClick={event => { event.stopPropagation(); setSelectedJob(job); }} disabled={job.applied || applyingJobId === job.id} className={`btn btn-sm w-full ${job.applied ? 'btn-success btn-outline' : 'btn-primary'}`}>
                        {applyingJobId === job.id ? <Loader2 className="w-4 h-4 animate-spin" /> : job.applied ? <><CheckCircle2 className="w-4 h-4" /> Applied</> : <><Send className="w-4 h-4" /> View & Apply</>}
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

      {successMessage && <div role="alert" className="alert alert-success fixed bottom-6 right-6 w-auto z-50 shadow-lg"><CheckCircle2 className="w-5 h-5" /><span>{successMessage}</span><button onClick={() => setSuccessMessage('')} className="btn btn-ghost btn-xs"><X className="w-4 h-4" /></button></div>}

      {selectedJob && (
        <div className="modal modal-open" onClick={() => setSelectedJob(null)}>
          <div className="modal-box max-w-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between mb-4"><div><h2 className="text-2xl text-base-content mb-1">{selectedJob.title}</h2><p className="text-primary text-lg">{selectedJob.company}</p></div><span className={`badge ${selectedJob.source === 'internal' ? 'badge-primary' : 'badge-success'}`}>{selectedJob.sourceLabel}</span></div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-base-content/50" /><div><p className="text-xs text-base-content/60">Location</p><p className="text-sm text-base-content">{selectedJob.location}</p></div></div>
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-base-content/50" /><div><p className="text-xs text-base-content/60">Type</p><p className="text-sm text-base-content">{selectedJob.type}</p></div></div>
              <div><p className="text-xs text-base-content/60">Salary</p><p className="text-sm text-success font-medium">{selectedJob.salary}</p></div>
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-base-content/50" /><div><p className="text-xs text-base-content/60">Posted</p><p className="text-sm text-base-content">{selectedJob.postedLabel}</p></div></div>
            </div>
            <div className="mb-6"><h3 className="text-base-content font-medium mb-2">Job Description</h3><p className="text-sm text-base-content/70 leading-relaxed">{selectedJob.description}</p></div>
            <div className="modal-action mt-0"><button onClick={() => setSelectedJob(null)} className="btn btn-outline flex-1">Close</button>{selectedJob.source === 'internal' ? <button disabled={selectedJob.applied} onClick={() => { setApplicationError(''); setApplicationJob(selectedJob); setSelectedJob(null); }} className="btn btn-primary flex-1">{selectedJob.applied ? 'Already Applied' : 'Apply Now'} <Send className="w-4 h-4" /></button> : <a href={selectedJob.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1">Apply on Adzuna <ExternalLink className="w-4 h-4" /></a>}</div>
          </div>
        </div>
      )}

      {applicationJob && (
        <div className="modal modal-open" onClick={() => !applyingJobId && setApplicationJob(null)}>
          <div className="modal-box w-[calc(100vw-32px)] max-w-[504px] min-h-[548px] max-h-[calc(100vh-32px)] overflow-y-auto p-4 sm:p-[18px] rounded-2xl" onClick={event => event.stopPropagation()}>
            <div className="rounded-xl border border-base-300 bg-base-200/50 px-4 py-3 mb-4 flex justify-between items-start">
              <div><p className="text-[9px] font-bold text-primary uppercase">Submit application</p><h2 className="text-base font-bold leading-tight">{applicationJob.title}</h2><p className="text-[11px] text-base-content/60">{applicationJob.company}</p></div>
              <button onClick={() => setApplicationJob(null)} className="btn btn-ghost btn-xs btn-circle"><X className="w-4 h-4" /></button>
            </div>
            {applicationError && <div className="alert alert-error text-xs py-2 mb-3"><span>{applicationError}</span></div>}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-base-content/70 uppercase mb-2">Resume / CV <span className="text-error">*</span></p>
              <input ref={applicationResumeRef} type="file" accept=".pdf,.doc,.docx" onChange={event => { setResume(event.target.files?.[0] || null); setApplicationError(''); }} className="hidden" />
              <button type="button" onClick={() => applicationResumeRef.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); setResume(event.dataTransfer.files[0] || null); setApplicationError(''); }} className="w-full h-[128px] rounded-xl border border-dashed border-base-content/30 hover:border-primary flex flex-col items-center justify-center gap-1.5 text-center transition-colors">
                <Upload className="w-7 h-7 text-primary" />
                <span className="text-[11px] font-semibold">{resume ? resume.name : 'Drag and drop your resume here'}</span>
                {!resume && <span className="text-[10px] text-base-content/60">or <span className="text-primary">browse files</span> from your device</span>}
                <span className="text-[9px] text-base-content/45">Supports PDF, DOC, DOCX up to 5MB</span>
              </button>
            </div>
            <div className="mb-4"><label className="block text-[10px] font-bold text-base-content/70 uppercase mb-2">Cover letter</label><textarea value={coverLetter} onChange={event => setCoverLetter(event.target.value)} className="textarea textarea-bordered w-full h-20 min-h-20 text-xs" placeholder="Tell us why you are interested in this position and what makes you a great fit..." /></div>
            <div><label className="block text-[10px] font-bold text-base-content/70 uppercase mb-2">Expected salary</label><input value={expectedSalary} onChange={event => setExpectedSalary(event.target.value)} className="input input-bordered w-full h-9 text-xs" placeholder="e.g. ₹50,000 per month" /></div>
            <div className="grid grid-cols-2 gap-2.5 mt-5"><button disabled={!!applyingJobId} onClick={() => setApplicationJob(null)} className="btn btn-outline btn-sm">Cancel</button><button disabled={!!applyingJobId} onClick={handleApply} className="btn btn-primary btn-sm">{applyingJobId ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Application</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
