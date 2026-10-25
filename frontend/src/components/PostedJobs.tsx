import { useState, useEffect } from 'react';
import { 
  MapPin, Briefcase, IndianRupee, Trash2, Building, Users, X, 
  Loader2, Sparkles, BrainCircuit, CheckCircle2, FileText, Eye, Send, Copy, Pencil, CalendarDays
} from 'lucide-react';
import { JobPosting } from "../App";
import { toast } from 'sonner';
import { 
  getJobApplications, updateApplicationStatus, deleteApplication, getCatalog, getApplicationHistory, inviteCandidateToJob,
  getApplicationResumeUrl, getCandidateMatches, updateJob, duplicateJob, scheduleInterview
} from '../services/api';

interface PostedJobsProps {
  jobs: JobPosting[];
  onDeleteJob: (jobId: string) => void;
  onUpdateJob: (job: JobPosting) => void;
  onDuplicateJob: (job: JobPosting) => void;
}

interface Applicant {
  application_id: string;
  candidate_id: string;
  name: string;
  email: string;
  status: string;
  cover_letter: string;
  expected_salary: string;
  resume_filename: string | null;
  has_resume: boolean;
  location?: string;
  location_fit?: {
    status: string;
    label: string;
    is_relocation_needed: boolean;
  };
  ats_score?: number | null;
  match_score?: number;
  skills?: string[];
  applied_at?: string;
  ai_evaluation?: {
    match_score?: number;
    reason?: string;
    missing_skills?: string[];
  };
}

const FALLBACK_STATUS_OPTIONS = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const NEXT_STAGES: Record<string, string[]> = {
  applied: ['screening', 'rejected'],
  screening: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
};

export function PostedJobs({ jobs, onDeleteJob, onUpdateJob, onDuplicateJob }: PostedJobsProps) {
  const [applicantsModalJob, setApplicantsModalJob] = useState<JobPosting | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'applied' | 'sourced'>('applied');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [sourcedMatches, setSourcedMatches] = useState<any[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [hasFetchedMatches, setHasFetchedMatches] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<string[]>(FALLBACK_STATUS_OPTIONS);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [histories, setHistories] = useState<Record<string, Array<{ id: string; from_stage: string; to_stage: string; note: string; created_at: string; by_user_name?: string | null }>>>({});
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null);
  const [invitingCandidateId, setInvitingCandidateId] = useState<string | null>(null);
  const [invitedCandidateIds, setInvitedCandidateIds] = useState<Set<string>>(new Set());
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [jobEdit, setJobEdit] = useState({ title: '', company: '', status: 'draft', deadline: '', openings: 1 });
  const [interviewApplicant, setInterviewApplicant] = useState<Applicant | null>(null);
  const [interviewDetails, setInterviewDetails] = useState({ starts_at: '', duration_minutes: 30, location: '', notes: '' });
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false);

  useEffect(() => {
    getCatalog()
      .then(data => {
        if (data.catalog?.application_statuses) {
          setStatusOptions(data.catalog.application_statuses);
        }
      })
      .catch(err => console.error('Failed to load catalog:', err));
  }, []);

  useEffect(() => {
    if (!applicantsModalJob) return;
    setActiveModalTab('applied');
    setSourcedMatches([]);
    setHasFetchedMatches(false);
    setIsLoadingApplicants(true);
    getJobApplications(applicantsModalJob.id)
      .then(data => setApplicants(data.applications || []))
      .catch(err => console.error('Failed to load applicants:', err))
      .finally(() => setIsLoadingApplicants(false));
  }, [applicantsModalJob]);

  const handleFetchSourced = async (jobId: string) => {
    setActiveModalTab('sourced');
    if (hasFetchedMatches && sourcedMatches.length > 0) return;

    setIsLoadingMatches(true);
    try {
      const data = await getCandidateMatches(jobId);
      setSourcedMatches(data.matches || []);
      setHasFetchedMatches(true);
    } catch (err) {
      console.error('Failed to load sourced candidate matches:', err);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const previous = applicants.find(a => a.application_id === applicationId)?.status;
    setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: newStatus } : a));
    setUpdatingId(applicationId);

    try {
      await updateApplicationStatus(applicationId, newStatus, notes[applicationId] || '');
      setNotes(prev => ({ ...prev, [applicationId]: '' }));
      const history = await getApplicationHistory(applicationId);
      setHistories(prev => ({ ...prev, [applicationId]: history.events || [] }));
      toast.success('Application status updated');
    } catch (err: any) {
      if (previous) {
        setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: previous } : a));
      }
      toast.error(err.message || 'Failed to update status. Reverted.');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleHistory = async (applicationId: string) => {
    if (histories[applicationId]) {
      setHistories(prev => { const next = { ...prev }; delete next[applicationId]; return next; });
      return;
    }
    setLoadingHistoryId(applicationId);
    try {
      const history = await getApplicationHistory(applicationId);
      setHistories(prev => ({ ...prev, [applicationId]: history.events || [] }));
    } catch (err: any) {
      toast.error(err.message || 'Could not load pipeline history.');
    } finally {
      setLoadingHistoryId(null);
    }
  };

  const handleInvite = async (jobId: string, candidateId: string) => {
    setInvitingCandidateId(candidateId);
    try {
      const result = await inviteCandidateToJob(jobId, candidateId);
      setInvitedCandidateIds(previous => new Set(previous).add(candidateId));
      toast.success(result.invited ? 'Invitation sent' : 'Candidate has already been invited');
    } catch (err: any) {
      toast.error(err.message || 'Could not send invitation.');
    } finally {
      setInvitingCandidateId(null);
    }
  };

  const handleRemoveApplication = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to remove this applicant from this post?')) return;
    setDeletingId(applicationId);
    try {
      await deleteApplication(applicationId);
      setApplicants(prev => prev.filter(a => a.application_id !== applicationId));
      toast.success('Applicant removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove applicant.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenResume = async (applicationId: string) => {
    setOpeningResumeId(applicationId);
    try {
      const { url } = await getApplicationResumeUrl(applicationId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      toast.error(err.message || 'Could not open the applicant resume.');
    } finally {
      setOpeningResumeId(null);
    }
  };

  const startEdit = (job: JobPosting) => {
    setEditingJob(job);
    setJobEdit({ title: job.title, company: job.company, status: job.status || 'draft', deadline: job.deadline ? job.deadline.slice(0, 10) : '', openings: job.openings || 1 });
  };
  const saveEdit = async () => {
    if (!editingJob) return;
    try {
      const result = await updateJob(editingJob.id, { ...jobEdit, deadline: jobEdit.deadline ? new Date(`${jobEdit.deadline}T23:59:59`).toISOString() : null });
      onUpdateJob(result.job);
      setEditingJob(null);
      toast.success('Job updated');
    } catch (err: any) { toast.error(err.message || 'Could not update job.'); }
  };
  const handleDuplicate = async (jobId: string) => {
    try { const result = await duplicateJob(jobId); onDuplicateJob(result.job); toast.success('Draft copy created'); }
    catch (err: any) { toast.error(err.message || 'Could not duplicate job.'); }
  };
  const saveInterview = async () => {
    if (!interviewApplicant || !interviewDetails.starts_at) { toast.error('Choose an interview date and time.'); return; }
    setIsSchedulingInterview(true);
    try {
      const { blob, filename } = await scheduleInterview(interviewApplicant.application_id, { ...interviewDetails, starts_at: new Date(interviewDetails.starts_at).toISOString() });
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
      setInterviewApplicant(null); toast.success('Interview scheduled and calendar file downloaded');
    } catch (err: any) { toast.error(err.message || 'Could not schedule interview.'); }
    finally { setIsSchedulingInterview(false); }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-base-100 rounded-xl shadow-sm border border-base-300">
        <Briefcase className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-base-content">No jobs posted yet</h3>
        <p className="text-base-content/60 mt-2">Create a new job posting to start finding candidates.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 hover:shadow-md relative">
            <button
              onClick={() => onDeleteJob(job.id)}
              className="absolute top-4 right-4 p-2 text-base-content/40 hover:text-error hover:bg-error/10 rounded-lg"
              title="Delete Job"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <div className="absolute top-4 right-14 flex gap-1">
              <button onClick={() => startEdit(job)} className="btn btn-ghost btn-xs" title="Edit job"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => handleDuplicate(job.id)} className="btn btn-ghost btn-xs" title="Duplicate job"><Copy className="w-4 h-4" /></button>
            </div>

            <div className="mb-4 pr-8">
              <h3 className="text-xl font-bold text-base-content mb-1">{job.title}</h3>
              <div className="flex items-center gap-2 text-primary font-medium">
                <Building className="w-4 h-4" />
                {job.company}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-base-content/70 text-sm">
                <MapPin className="w-4 h-4 text-base-content/40" />
                {job.location || 'Remote'}
              </div>
              <div className="flex items-center gap-2 text-base-content/70 text-sm">
                <Briefcase className="w-4 h-4 text-base-content/40" />
                {job.type}
              </div>
              <div className="flex items-center gap-2 text-success font-medium text-sm">
                <IndianRupee className="w-4 h-4" />
                {job.salary || 'Not specified'}
              </div>
              <div className="flex items-center gap-2 text-base-content/70 text-sm"><span className={`badge badge-sm ${job.status === 'open' ? 'badge-success' : job.status === 'closed' ? 'badge-error' : 'badge-ghost'}`}>{job.status || 'draft'}</span><span>{job.openings || 1} opening{(job.openings || 1) === 1 ? '' : 's'}</span>{job.deadline && <span>· Due {new Date(job.deadline).toLocaleDateString()}</span>}</div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-2">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 text-xs rounded-md font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setApplicantsModalJob(job)}
              className="btn btn-outline btn-primary btn-sm w-full gap-2"
            >
              <Users className="w-4 h-4" /> View Candidates
            </button>
          </div>
        ))}
      </div>

      {/* Candidates Modal (Applied + Sourced) */}
      {editingJob && <div className="modal modal-open"><div className="modal-box"><h3 className="font-bold text-lg mb-4">Edit job</h3><div className="space-y-3"><input value={jobEdit.title} onChange={e => setJobEdit({ ...jobEdit, title: e.target.value })} className="input input-bordered w-full" placeholder="Title" /><input value={jobEdit.company} onChange={e => setJobEdit({ ...jobEdit, company: e.target.value })} className="input input-bordered w-full" placeholder="Company" /><div className="grid grid-cols-3 gap-2"><select value={jobEdit.status} onChange={e => setJobEdit({ ...jobEdit, status: e.target.value })} className="select select-bordered"><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></select><input type="date" value={jobEdit.deadline} onChange={e => setJobEdit({ ...jobEdit, deadline: e.target.value })} className="input input-bordered" /><input type="number" min="1" value={jobEdit.openings} onChange={e => setJobEdit({ ...jobEdit, openings: Math.max(1, Number(e.target.value)) })} className="input input-bordered" /></div></div><div className="modal-action"><button className="btn btn-ghost" onClick={() => setEditingJob(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save</button></div></div></div>}
      {interviewApplicant && <div className="modal modal-open"><div className="modal-box"><h3 className="font-bold text-lg">Schedule interview</h3><p className="text-sm text-base-content/60 mb-4">{interviewApplicant.name}</p><div className="space-y-3"><input type="datetime-local" value={interviewDetails.starts_at} onChange={e => setInterviewDetails({ ...interviewDetails, starts_at: e.target.value })} className="input input-bordered w-full" /><div className="grid grid-cols-2 gap-3"><input type="number" min="15" max="480" value={interviewDetails.duration_minutes} onChange={e => setInterviewDetails({ ...interviewDetails, duration_minutes: Number(e.target.value) })} className="input input-bordered" /><input value={interviewDetails.location} onChange={e => setInterviewDetails({ ...interviewDetails, location: e.target.value })} className="input input-bordered" placeholder="Video link or location" /></div><textarea value={interviewDetails.notes} onChange={e => setInterviewDetails({ ...interviewDetails, notes: e.target.value })} className="textarea textarea-bordered w-full" placeholder="Interview notes" /></div><div className="modal-action"><button className="btn btn-ghost" disabled={isSchedulingInterview} onClick={() => setInterviewApplicant(null)}>Cancel</button><button className="btn btn-primary" disabled={isSchedulingInterview} onClick={saveInterview}>{isSchedulingInterview && <Loader2 className="w-4 h-4 animate-spin" />}Schedule & download .ics</button></div></div></div>}
      {applicantsModalJob && (
        <div className="modal modal-open" onClick={() => setApplicantsModalJob(null)}>
          <div className="modal-box max-w-4xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4 border-b border-base-300 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-base-content">{applicantsModalJob.title}</h3>
                  <span className="badge badge-primary badge-sm">{applicantsModalJob.company}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-base-content/70">
                  <span className="badge badge-outline badge-sm">📍 {applicantsModalJob.location || 'Remote'}</span>
                  <span className="badge badge-outline badge-sm">{applicantsModalJob.type || 'Full-time'}</span>
                  <span className="text-success font-semibold">{applicantsModalJob.salary || 'Salary Not Specified'}</span>
                </div>
              </div>
              <button onClick={() => setApplicantsModalJob(null)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-base-300">
              <button
                onClick={() => setActiveModalTab('applied')}
                className={`pb-2 px-3 font-semibold text-sm border-b-2 transition-all ${
                  activeModalTab === 'applied'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
              >
                Applied Candidates ({applicants.length})
              </button>
              <button
                onClick={() => handleFetchSourced(applicantsModalJob.id)}
                className={`pb-2 px-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-1.5 ${
                  activeModalTab === 'sourced'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
              >
                <Sparkles className="w-4 h-4 text-primary" />
                AI Sourced Top 10 {hasFetchedMatches ? `(${sourcedMatches.length})` : ''}
              </button>
            </div>

            {/* TAB 1: APPLIED CANDIDATES */}
            {activeModalTab === 'applied' && (
              <div>
                {isLoadingApplicants ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
                ) : applicants.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-base-200 text-base-content/40 flex items-center justify-center mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base-content text-base">No applicants yet</h4>
                      <p className="text-sm text-base-content/60 mt-1 max-w-md mx-auto">
                        No job seekers have applied for this post yet. Proactively source top matching candidates for this specific post from our talent pool.
                      </p>
                    </div>
                    <button
                      onClick={() => handleFetchSourced(applicantsModalJob.id)}
                      disabled={isLoadingMatches}
                      className="btn btn-primary btn-sm gap-2"
                    >
                      {isLoadingMatches ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      🔍 Find 10 Sourced Candidates for this Post
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-base-200/60 border border-base-300 rounded-lg text-xs">
                      <span className="text-base-content/70">Want to see more candidates tailored to this post?</span>
                      <button
                        onClick={() => handleFetchSourced(applicantsModalJob.id)}
                        disabled={isLoadingMatches}
                        className="btn btn-primary btn-xs gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Source Candidates
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                      {applicants.map(a => (
                        <div
                          key={a.application_id}
                          className="bg-base-200/50 p-4 rounded-xl border border-base-300 hover:border-primary/40 transition-all space-y-3"
                        >
                          {/* Top Row: Candidate details, badges & Decision / Remove */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 shrink-0 bg-linear-to-br from-primary/20 to-secondary/20 text-primary font-bold rounded-full flex items-center justify-center text-sm">
                                {a.name ? a.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-bold text-base text-base-content">{a.name}</h4>
                                  {a.match_score !== undefined && (
                                    <span className={`badge badge-sm font-bold ${
                                      a.match_score >= 80 ? 'bg-success/20 text-success' : a.match_score >= 60 ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
                                    }`}>
                                      {a.match_score}% Match
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-base-content/60">{a.email}</p>

                                {/* Location & Relocation Indicators */}
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-base-content/70">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                    {a.location || 'Location not specified'}
                                  </span>

                                  {a.location_fit?.status === 'relocation' && (
                                    <span className="badge badge-warning badge-xs font-semibold">
                                      {a.location_fit.label}
                                    </span>
                                  )}
                                  {a.location_fit?.status === 'local' && (
                                    <span className="badge badge-success badge-xs font-semibold">
                                      📍 Local Candidate
                                    </span>
                                  )}
                                  {a.location_fit?.status === 'nearby' && (
                                    <span className="badge badge-info badge-xs font-semibold">
                                      🚗 Commutable
                                    </span>
                                  )}
                                  {a.location_fit?.status === 'remote' && (
                                    <span className="badge badge-ghost badge-xs font-semibold">
                                      🏠 Remote Eligible
                                    </span>
                                  )}

                                  <span className="flex items-center gap-1 pl-1">
                                    <FileText className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                    ATS Score: <span className="font-semibold text-base-content">{a.ats_score ?? 'N/A'}</span>
                                  </span>
                                  {a.expected_salary && (
                                    <span className="text-base-content/60">
                                      Expected: <span className="font-medium text-base-content">{a.expected_salary}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Decision Dropdown & Remove Button */}
                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                              <select
                                value={a.status}
                                disabled={updatingId === a.application_id}
                                onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                                className="select select-bordered select-xs capitalize font-medium bg-base-100"
                              >
                                {[a.status, ...(NEXT_STAGES[a.status] || [])]
                                  .filter((stage, index, stages) => stages.indexOf(stage) === index && statusOptions.includes(stage))
                                  .map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <input
                                value={notes[a.application_id] || ''}
                                onChange={(e) => setNotes(prev => ({ ...prev, [a.application_id]: e.target.value }))}
                                maxLength={2000}
                                placeholder="Transition note (optional)"
                                className="input input-bordered input-xs w-48"
                                aria-label={`Note for ${a.name}'s stage change`}
                              />
                              <button
                                type="button"
                                onClick={() => toggleHistory(a.application_id)}
                                disabled={loadingHistoryId === a.application_id}
                                className="btn btn-ghost btn-xs"
                              >
                                {loadingHistoryId === a.application_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'History'}
                              </button>
                              <button type="button" className="btn btn-outline btn-xs gap-1" onClick={() => { setInterviewApplicant(a); setInterviewDetails({ starts_at: '', duration_minutes: 30, location: '', notes: '' }); }}><CalendarDays className="w-3.5 h-3.5" /> Interview</button>
                              <button
                                onClick={() => handleRemoveApplication(a.application_id)}
                                disabled={deletingId === a.application_id}
                                title="Remove candidate from this job"
                                className="btn btn-ghost btn-xs text-error hover:bg-error/10 p-1"
                              >
                                {deletingId === a.application_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {histories[a.application_id] && (
                            <div className="rounded-lg border border-base-300 bg-base-100 p-3 text-xs space-y-2">
                              <p className="font-semibold text-base-content/70">Pipeline history</p>
                              {histories[a.application_id].length === 0 ? <p className="text-base-content/50">No stage changes yet.</p> : histories[a.application_id].map(event => (
                                <div key={event.id} className="border-l-2 border-primary/40 pl-2">
                                  <span className="font-medium capitalize">{event.from_stage} → {event.to_stage}</span>
                                  <span className="text-base-content/50"> · {new Date(event.created_at).toLocaleString()}</span>
                                  {event.by_user_name && <span className="text-base-content/50"> · {event.by_user_name}</span>}
                                  {event.note && <p className="mt-0.5 text-base-content/70">{event.note}</p>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* AI Evaluation Reason & Cover Letter */}
                          {a.ai_evaluation?.reason && (
                            <div className="bg-primary/10 p-2.5 rounded-lg text-xs italic text-base-content/90 border-l-2 border-primary flex items-start gap-2">
                              <BrainCircuit className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span>"{a.ai_evaluation.reason}"</span>
                            </div>
                          )}

                          {a.cover_letter && (
                            <div className="bg-base-100 p-2.5 rounded-lg text-xs italic text-base-content/80 border-l-2 border-base-content/30">
                              <span className="font-semibold not-italic text-base-content/60 mr-1">Cover Letter:</span>
                              "{a.cover_letter}"
                            </div>
                          )}

                          {/* Bottom Row: Verified Skills & Resume View with Eye Icon */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-base-300 text-xs">
                            {/* Verified Skills */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-semibold text-base-content/60 mr-1">Verified Skills:</span>
                              {a.skills && a.skills.length > 0 ? (
                                a.skills.slice(0, 6).map(skill => (
                                  <span key={skill} className="badge badge-neutral badge-xs gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-success" /> {skill}
                                  </span>
                                ))
                              ) : (
                                <span className="text-base-content/50 italic">None listed</span>
                              )}
                              {a.skills && a.skills.length > 6 && (
                                <span className="text-xs text-base-content/50 font-medium">+{a.skills.length - 6} more</span>
                              )}
                            </div>

                            {/* Resume View Icon (Eye) */}
                            <div className="shrink-0">
                              {a.has_resume ? (
                                <button
                                  disabled={openingResumeId === a.application_id}
                                  onClick={() => handleOpenResume(a.application_id)}
                                  className="btn btn-primary btn-outline btn-xs gap-1.5"
                                >
                                  {openingResumeId === a.application_id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Eye className="w-3.5 h-3.5" />
                                  )}
                                  View Resume
                                </button>
                              ) : (
                                <span className="text-base-content/40 italic text-xs">No resume attached</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AI SOURCED CANDIDATES */}
            {activeModalTab === 'sourced' && (
              <div>
                {isLoadingMatches ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <BrainCircuit className="w-12 h-12 text-primary animate-pulse" />
                    <p className="text-sm font-medium text-base-content/70">
                      AI is evaluating post requirements and candidate location compatibility...
                    </p>
                  </div>
                ) : sourcedMatches.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <p className="text-base-content/60 text-sm">No matching candidates found for this post's criteria.</p>
                    <button
                      onClick={() => handleFetchSourced(applicantsModalJob.id)}
                      className="btn btn-outline btn-primary btn-sm gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Retry AI Matching
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                    {sourcedMatches.map((candidate, index) => (
                      <div
                        key={candidate.candidate_id}
                        className="bg-base-200/50 p-5 rounded-xl border border-base-300 hover:border-primary/40 transition-all"
                      >
                        <div className="flex flex-col md:flex-row gap-5">
                          {/* Left Column: Candidate Info */}
                          <div className="md:w-1/3 md:border-r border-base-300 pr-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 shrink-0 bg-primary/20 text-primary font-bold text-sm rounded-full flex items-center justify-center">
                                #{index + 1}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-base font-bold text-base-content truncate">
                                  {candidate.name || candidate.email.split('@')[0]}
                                </h4>
                                <p className="text-xs text-base-content/60 truncate">{candidate.email}</p>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-base-content/70">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                <span className="truncate">{candidate.location || 'Location not specified'}</span>
                              </div>

                              {candidate.location_fit?.status === 'relocation' && (
                                <div className="badge badge-warning badge-sm gap-1 font-semibold text-xs py-1.5 px-2">
                                  {candidate.location_fit.label}
                                </div>
                              )}
                              {candidate.location_fit?.status === 'local' && (
                                <div className="badge badge-success badge-sm gap-1 font-semibold text-xs py-1.5 px-2">
                                  📍 Local Candidate
                                </div>
                              )}
                              {candidate.location_fit?.status === 'nearby' && (
                                <div className="badge badge-info badge-sm gap-1 font-semibold text-xs py-1.5 px-2">
                                  🚗 Commutable
                                </div>
                              )}
                              {candidate.location_fit?.status === 'remote' && (
                                <div className="badge badge-ghost badge-sm gap-1 font-semibold text-xs py-1.5 px-2">
                                  🏠 Remote Eligible
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 pt-1">
                                <FileText className="w-3.5 h-3.5 text-base-content/40 shrink-0" />
                                ATS Score: <span className="font-semibold text-base-content">{candidate.resume_score || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: AI Evaluation */}
                          <div className="md:w-2/3">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
                                <BrainCircuit className="w-4 h-4 text-primary" /> AI Evaluation
                              </span>
                              <div className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                                candidate.match_score >= 80 
                                  ? 'bg-success/20 text-success' 
                                  : candidate.match_score >= 60 
                                  ? 'bg-warning/20 text-warning' 
                                  : 'bg-error/20 text-error'
                              }`}>
                                {candidate.match_score}% Match
                              </div>
                            </div>

                            <div className="bg-primary/10 p-3 rounded-lg text-base-content text-xs italic border-l-4 border-primary mb-3">
                              "{candidate.ai_evaluation?.reason || 'Strong candidate profile based on technical skill mapping.'}"
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-base-content/60 mb-1.5">Verified Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {candidate.skills?.slice(0, 7).map((skill: string) => (
                                  <span key={skill} className="px-2 py-0.5 bg-base-100 text-base-content/80 text-xs rounded border border-base-300 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-success" /> {skill}
                                  </span>
                                ))}
                                {candidate.skills?.length > 7 && (
                                  <span className="text-xs text-base-content/50 py-0.5 font-medium">
                                    +{candidate.skills.length - 7} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleInvite(applicantsModalJob.id, candidate.candidate_id)}
                              disabled={invitingCandidateId === candidate.candidate_id || invitedCandidateIds.has(candidate.candidate_id)}
                              className="btn btn-primary btn-sm mt-4 gap-2"
                            >
                              {invitingCandidateId === candidate.candidate_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              {invitedCandidateIds.has(candidate.candidate_id) ? 'Invited' : 'Invite to apply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
