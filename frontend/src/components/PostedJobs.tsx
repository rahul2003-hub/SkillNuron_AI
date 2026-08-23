import { MapPin, Briefcase, IndianRupee, Trash2, Building } from "lucide-react";
import { JobPosting } from "../App";

interface PostedJobsProps {
  jobs: JobPosting[];
  onDeleteJob: (jobId: string) => void;
}

export function PostedJobs({ jobs, onDeleteJob }: PostedJobsProps) {
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

          <div>
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

        </div>
      ))}
    </div>
  );
}