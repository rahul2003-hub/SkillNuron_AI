import { useState, useEffect } from 'react';
import { MapPin, Briefcase, IndianRupee, Trash2, Building, Users, X, Loader2 } from 'lucide-react';
import { JobPosting } from "../App";
import { getJobApplications, updateApplicationStatus } from '../services/api';

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
}

const STATUS_OPTIONS = ['applied', 'shortlisted', 'rejected', 'hired'];

export function PostedJobs({ jobs, onDeleteJob }: PostedJobsProps) {
  const [applicantsModalJob, setApplicantsModalJob] = useState<JobPosting | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!applicantsModalJob) return;
    setIsLoadingApplicants(true);
    getJobApplications(applicantsModalJob.id)
      .then(data => setApplicants(data.applications || []))
      .catch(err => console.error('Failed to load applicants:', err))
      .finally(() => setIsLoadingApplicants(false));
  }, [applicantsModalJob]);

  const handleStatusChange = async (applicationId: string, status: string) => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, status);
      setApplicants(prev => prev.map(a => a.application_id === applicationId ? { ...a, status } : a));
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
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
          <div key={job.id} className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 hover:shadow-md transition-shadow relative">

            <button
              onClick={() => onDeleteJob(job.id)}
              className="absolute top-4 right-4 p-2 text-base-content/40 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
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
                    <tr><th>Name</th><th>Email</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {applicants.map(a => (
                      <tr key={a.application_id}>
                        <td className="font-medium text-base-content">{a.name}</td>
                        <td className="text-base-content/70">{a.email}</td>
                        <td>
                          <select
                            value={a.status}
                            disabled={updatingId === a.application_id}
                            onChange={(e) => handleStatusChange(a.application_id, e.target.value)}
                            className="select select-bordered select-xs capitalize"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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