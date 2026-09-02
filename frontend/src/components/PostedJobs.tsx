// Save as: frontend/src/components/PostedJobs.tsx (replaces existing file)

import { useState, useEffect } from 'react';
import { MapPin, Briefcase, IndianRupee, Trash2, Building, Users, X, Loader2, Download } from 'lucide-react';
import { JobPosting } from "../App";
import { getJobApplications, updateApplicationStatus, getCatalog, getApplicationResumeUrl } from '../services/api';

interface PostedJobsProps {
  jobs: JobPosting[];
  onDeleteJob: (jobId: string) => void;
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
}

// Fallback only used if the catalog fetch hasn't resolved yet — the
// authoritative list is ALLOWED_STATUSES in backend/models/application.py,
// served via GET /api/profile/catalog.
const FALLBACK_STATUS_OPTIONS = ['applied', 'shortlisted', 'rejected', 'hired'];

export function PostedJobs({ jobs, onDeleteJob }: PostedJobsProps) {
  const [applicantsModalJob, setApplicantsModalJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [statusOptions, setStatusOptions] = useState<string[]>(FALLBACK_STATUS_OPTIONS);

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
    setIsLoadingApplicants(true);
    getJobApplications(applicantsModalJob.id)
      .then(data => setApplicants(data.applications || []))
      .catch(err => console.error('Failed to load applicants:', err))
      .finally(() => setIsLoadingApplicants(false));
  }, [applicantsModalJob]);

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    const previous = applicants.find(a => a.application_id === applicationId)?.status;

    // Optimistic update
    setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: newStatus } : a));
    setUpdatingId(applicationId);

    try {
      await updateApplicationStatus(applicationId, newStatus);
    } catch (err: any) {
      // Roll back to the previous status on failure — UI must not silently
      // desync from the backend.
      if (previous) {
        setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status: previous } : a));
      }
      alert(err.message || 'Failed to update status. Reverted.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenResume = async (applicationId: string) => {
    setOpeningResumeId(applicationId);
    try {
      const { url } = await getApplicationResumeUrl(applicationId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      alert(err.message || 'Could not open the applicant resume.');
    } finally {
      setOpeningResumeId(null);
    }
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
          <div key={job.id} className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 hover:shadow-md  relative">

            <button
              onClick={() => onDeleteJob(job.id)}
              className="absolute top-4 right-4 p-2 text-base-content/40 hover:text-error hover:bg-error/10 rounded-lg "
              title="Delete Job"
            >
              <Trash2 className="w-5 h-5" />
            </button>

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
              className="btn btn-outline btn-primary btn-sm w-full"
            >
              <Users className="w-4 h-4" /> View Applicants
            </button>

          </div>
        ))}
      </div>

      {/* Applicants Modal */}
      {applicantsModalJob && (
        <div className="modal modal-open" onClick={() => setApplicantsModalJob(null)}>
          <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-base-content">{applicantsModalJob.title}</h3>
                <p className="text-sm text-base-content/60">Applicants</p>
              </div>
              <button onClick={() => setApplicantsModalJob(null)} className="btn btn-ghost btn-sm btn-circle">
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingApplicants ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
            ) : applicants.length === 0 ? (
              <p className="text-sm text-base-content/50 text-center py-10">No applicants yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr><th>Applicant</th><th>Application</th><th>Decision</th></tr>
                  </thead>
                  <tbody>
                    {applicants.map(a => (
                      <tr key={a.application_id}>
                        <td><p className="font-medium text-base-content">{a.name}</p><p className="text-sm text-base-content/70">{a.email}</p></td>
                        <td className="space-y-2"><button disabled={!a.has_resume || openingResumeId === a.application_id} onClick={() => handleOpenResume(a.application_id)} className="btn btn-ghost btn-xs text-primary"><Download className="w-3.5 h-3.5" /> {openingResumeId === a.application_id ? 'Opening…' : a.resume_filename || 'No resume'}</button>{a.cover_letter && <p className="text-xs text-base-content/70 max-w-56 line-clamp-3">{a.cover_letter}</p>}{a.expected_salary && <p className="text-xs text-base-content/60">Expected: {a.expected_salary}</p>}</td>
                        <td>
                          <select
                            value={a.status}
                            disabled={updatingId === a.application_id}
                            onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                            className="select select-bordered select-xs capitalize"
                          >
                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
