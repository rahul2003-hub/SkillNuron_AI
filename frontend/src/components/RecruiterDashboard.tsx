import { useState, useEffect } from 'react';
import { Brain, LogOut, Plus, Briefcase, Users } from 'lucide-react';
import { PostedJobs } from './PostedJobs';
import { CreateJobPost } from './CreateJobPost';
import { CandidateMatches } from './CandidateMatches';
import { JobPosting } from '../App';

interface RecruiterDashboardProps {
  userName: string;
  userId: string;
  onLogout: () => void;
}

type Tab = 'posted-jobs' | 'create-job' | 'candidates';

export function RecruiterDashboard({ userName, userId, onLogout }: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posted-jobs');
  
  // 1. Start with an empty array instead of mock data
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch jobs from the database when the dashboard loads
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const data = await response.json();
        if (data.success) {
          // Filter to only show jobs posted by this specific recruiter
          const myJobs = data.jobs.filter((job: JobPosting) => job.postedBy === userName);
          setJobs(myJobs);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [userName]); // Re-run if the userName changes

  const handleCreateJob = (job: JobPosting) => {
    // Add the new job to the top of the list locally so it feels instant
    setJobs([job, ...jobs]);
    setActiveTab('posted-jobs');
  };

  const handleDeleteJob = async (jobId: string) => {
    // 1. Delete from database
    try {
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete job');
      
      // 2. Remove from React state to update the UI
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
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
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'posted-jobs' && (
                <PostedJobs jobs={jobs} onDeleteJob={handleDeleteJob} />
              )}
              {activeTab === 'create-job' && (
                <CreateJobPost onCreateJob={handleCreateJob} recruiterName={userName} />
              )}
              {activeTab === 'candidates' && (
                <CandidateMatches jobs={jobs} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}