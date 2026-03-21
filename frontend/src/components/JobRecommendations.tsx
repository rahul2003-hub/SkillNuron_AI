import { useState } from 'react';
import { MapPin, Briefcase, DollarSign, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { JobPosting } from '../App';

const recommendedJobs: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k - $160k',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
    description: 'We are looking for an experienced Full Stack Developer to join our growing team. You will work on cutting-edge projects using modern technologies.',
    postedBy: 'TechCorp Recruiter',
    postedDate: '2025-11-20',
    matchScore: 85,
  },
  {
    id: '2',
    title: 'Frontend Developer (React)',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$100k - $140k',
    requiredSkills: ['React', 'JavaScript', 'HTML/CSS', 'Git', 'REST APIs'],
    description: 'Join our fast-growing startup and help build the next generation of web applications. We value creativity and innovation.',
    postedBy: 'StartupXYZ HR',
    postedDate: '2025-11-22',
    matchScore: 92,
  },
  {
    id: '3',
    title: 'Python Backend Engineer',
    company: 'DataDriven Co.',
    location: 'New York, NY',
    type: 'Full-time',
    salary: '$110k - $150k',
    requiredSkills: ['Python', 'SQL', 'Django', 'PostgreSQL', 'Docker'],
    description: 'Work on data-intensive applications and APIs. Experience with SQL databases is a must.',
    postedBy: 'DataDriven Talent',
    postedDate: '2025-11-18',
    matchScore: 78,
  },
  {
    id: '4',
    title: 'Full Stack JavaScript Developer',
    company: 'CloudSoft Solutions',
    location: 'Remote (US Only)',
    type: 'Contract',
    salary: '$90k - $120k',
    requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Git'],
    description: 'Contract position for 6 months with possibility of extension. Work on cloud-based SaaS products.',
    postedBy: 'CloudSoft HR',
    postedDate: '2025-11-24',
    matchScore: 88,
  },
  {
    id: '5',
    title: 'Web Developer',
    company: 'Creative Agency Pro',
    location: 'Los Angeles, CA',
    type: 'Full-time',
    salary: '$80k - $110k',
    requiredSkills: ['HTML/CSS', 'JavaScript', 'React', 'Git', 'Responsive Design'],
    description: 'Build beautiful websites for our clients. Strong design sensibility required.',
    postedBy: 'Creative Agency',
    postedDate: '2025-11-25',
    matchScore: 82,
  },
  {
    id: '6',
    title: 'Mid-Level Software Engineer',
    company: 'Enterprise Systems Inc.',
    location: 'Austin, TX',
    type: 'Full-time',
    salary: '$95k - $130k',
    requiredSkills: ['Python', 'JavaScript', 'SQL', 'Docker', 'Kubernetes'],
    description: 'Work on enterprise-grade applications serving millions of users. Great benefits and work-life balance.',
    postedBy: 'Enterprise Talent',
    postedDate: '2025-11-19',
    matchScore: 75,
  },
];

export function JobRecommendations() {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [filter, setFilter] = useState<'all' | 'high-match'>('all');

  const filteredJobs = filter === 'high-match' 
    ? recommendedJobs.filter(job => (job.matchScore || 0) >= 80)
    : recommendedJobs;

  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-2">AI-Matched Job Recommendations</h2>
            <p className="opacity-90">
              These positions are personalized based on your skills, experience, and career goals. Match scores indicate compatibility.
            </p>
          </div>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl text-gray-900">{filteredJobs.length}</p>
            <p className="text-sm text-gray-600">Available Jobs</p>
          </div>
          <div>
            <p className="text-2xl text-green-600">{recommendedJobs.filter(j => (j.matchScore || 0) >= 85).length}</p>
            <p className="text-sm text-gray-600">High Matches</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Jobs
          </button>
          <button
            onClick={() => setFilter('high-match')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'high-match' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            High Match (80%+)
          </button>
        </div>
      </div>

      {/* Job Listings */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div 
            key={job.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            {/* Match Score Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getMatchColor(job.matchScore || 0)}`}>
                <Star className="w-4 h-4" />
                <span className="text-sm">{job.matchScore}% Match</span>
              </div>
              <span className="text-xs text-gray-500">{job.postedDate}</span>
            </div>

            {/* Job Info */}
            <h3 className="text-xl text-gray-900 mb-2">{job.title}</h3>
            <p className="text-purple-600 mb-4">{job.company}</p>

            <div className="space-y-2 mb-4">
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

            {/* Skills */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.slice(0, 4).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {skill}
                  </span>
                ))}
                {job.requiredSkills.length > 4 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    +{job.requiredSkills.length - 4} more
                  </span>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
              View Details
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-3xl text-gray-900 mb-2">{selectedJob.title}</h2>
                <p className="text-xl text-purple-600 mb-4">{selectedJob.company}</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getMatchColor(selectedJob.matchScore || 0)}`}>
                <Star className="w-5 h-5" />
                <span>{selectedJob.matchScore}% Match</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Location</p>
                  <p className="text-gray-900">{selectedJob.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Job Type</p>
                  <p className="text-gray-900">{selectedJob.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Salary</p>
                  <p className="text-green-600">{selectedJob.salary}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-600">Posted</p>
                  <p className="text-gray-900">{selectedJob.postedDate}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-900 mb-3">Job Description</h3>
              <p className="text-gray-600 leading-relaxed">{selectedJob.description}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedJob.requiredSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all">
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
