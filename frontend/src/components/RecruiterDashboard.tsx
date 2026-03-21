import { useState } from 'react';
import { Brain, LogOut, Plus, Briefcase, Users } from 'lucide-react';
import { PostedJobs } from './PostedJobs';
import { CreateJobPost } from './CreateJobPost';
import { CandidateMatches } from './CandidateMatches';
import { JobPosting } from '../App';

interface RecruiterDashboardProps {
  userName: string;
  onLogout: () => void;
}

type Tab = 'posted-jobs' | 'create-job' | 'candidates';

const initialJobs: JobPosting[] = [
  {
    id: '1',
    title: 'Senior Full Stack Developer',
    company: 'TechCorp Inc.',
    location: 'Remote',
    type: 'Full-time',
    salary: '$120k - $160k',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
    description: 'We are looking for an experienced Full Stack Developer to join our growing team.',
    postedBy: 'Demo Recruiter',
    postedDate: '2025-11-20',
  },
];

export function RecruiterDashboard({ userName, onLogout }: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posted-jobs');
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs);

  const handleCreateJob = (job: JobPosting) => {
    setJobs([job, ...jobs]);
    setActiveTab('posted-jobs');
  };

  const handleDeleteJob = (jobId: string) => {
    setJobs(jobs.filter(job => job.id !== jobId));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <span className="text-2xl text-purple-900">SkillNuron AI</span>
              <span className="hidden sm:inline px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full ml-2">Recruiter</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="text-gray-900">{userName}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8 p-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('posted-jobs')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'posted-jobs'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>My Jobs</span>
            </button>
            <button
              onClick={() => setActiveTab('create-job')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'create-job'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Post new job</span>
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all ${
                activeTab === 'candidates'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Candidates</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {activeTab === 'posted-jobs' && (
            <PostedJobs jobs={jobs} onDeleteJob={handleDeleteJob} />
          )}
          {activeTab === 'create-job' && (
            <CreateJobPost onCreateJob={handleCreateJob} recruiterName={userName} />
          )}
          {activeTab === 'candidates' && (
            <CandidateMatches jobs={jobs} />
          )}
        </div>
      </div>
    </div>
  );
}
