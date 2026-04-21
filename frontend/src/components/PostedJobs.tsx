import { MapPin, Briefcase, DollarSign, Trash2, Users } from 'lucide-react';
import { JobPosting } from '../App';

interface PostedJobsProps {
  jobs: JobPosting[];
  onDeleteJob: (jobId: string) => void;
}

export function PostedJobs({ jobs, onDeleteJob }: PostedJobsProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl text-gray-900">Your Posted Jobs</h2>
            <p className="text-gray-600 mt-1">Manage your job postings and track applications</p>
          </div>
          <div className="text-right">
            <p className="text-3xl text-purple-600">{jobs.length}</p>
            <p className="text-sm text-gray-600">Active Postings</p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl text-gray-900 mb-2">No job postings yet</h3>
            <p className="text-gray-600">Create your first job posting to find talented candidates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl text-gray-900 mb-2">{job.title}</h3>
                    <p className="text-purple-600 mb-3">{job.company}</p>
                  </div>
                  <button
                    onClick={() => onDeleteJob(job.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete job"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">{job.description}</p>

                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Required Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{Math.floor(Math.random() * 20) + 5} matching candidates</span>
                  </div>
                  <span className="text-sm text-gray-500">Posted on {job.postedDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
