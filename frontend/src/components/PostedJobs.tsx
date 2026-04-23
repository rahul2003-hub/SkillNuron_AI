import { MapPin, Briefcase, IndianRupee, Trash2, Building } from "lucide-react";
import { JobPosting } from "../App";

interface PostedJobsProps {
  jobs: JobPosting[];
  onDeleteJob: (jobId: string) => void;
}

export function PostedJobs({ jobs, onDeleteJob }: PostedJobsProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">No jobs posted yet</h3>
        <p className="text-gray-500 mt-2">Create a new job posting to start finding candidates.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {jobs.map((job) => (
        <div key={job.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative">
          
          <button
            onClick={() => onDeleteJob(job.id)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Job"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="mb-4 pr-8">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
            <div className="flex items-center gap-2 text-purple-600 font-medium">
              <Building className="w-4 h-4" />
              {job.company}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              {job.location || 'Remote'}
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Briefcase className="w-4 h-4 text-gray-400" />
              {job.type}
            </div>
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
              <IndianRupee className="w-4 h-4" />
              {job.salary || 'Not specified'}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills?.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-100 text-xs rounded-md font-medium"
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