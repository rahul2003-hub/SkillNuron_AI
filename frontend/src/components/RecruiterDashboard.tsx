import { useState, useEffect } from 'react';
import { Brain, LogOut, Plus, Briefcase, Users, TrendingUp, FileText, Star } from 'lucide-react';
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
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Recruiter Analytics
  const [analytics, setAnalytics] = useState({
    total_jobs: 0,
    total_candidates: 0,
    average_resume_score: 0,
    top_skills: [] as {skill: string, count: number}[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch Jobs for this recruiter
        const jobsRes = await fetch('http://localhost:8000/api/jobs');
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.success) {
            const myJobs = jobsData.jobs.filter((job: JobPosting) => job.postedBy === userName);
            setJobs(myJobs);
          }
        }

        // 2. Fetch Analytics
        const analyticsRes = await fetch('http://localhost:8000/recruiter/analytics');
        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userName]);

  const handleCreateJob = (job: JobPosting) => {
    setJobs([job, ...jobs]);
    setActiveTab('posted-jobs');
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/jobs/${jobId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete job');
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert("Failed to delete job.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">SkillNuron AI</span>
            <span className="hidden sm:inline px-3 py-1 bg-pink-100 text-pink-700 text-sm rounded-full font-medium ml-2">Recruiter</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-gray-900 font-semibold">{userName}</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        
        {/* Analytics KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><Briefcase className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_jobs}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Talent Pool</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_candidates}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg text-green-600"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Avg Resume Score</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.average_resume_score || 0}%</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-pink-100 rounded-lg text-pink-600"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Top Skill</p>
              <p className="text-lg font-bold text-gray-900 line-clamp-1">
                {analytics.top_skills.length > 0 ? analytics.top_skills[0].skill : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8 p-2 border border-gray-100">
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setActiveTab('posted-jobs')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'posted-jobs' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">My Jobs</span>
            </button>
            <button onClick={() => setActiveTab('create-job')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'create-job' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Post New Job</span>
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'candidates' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Star className="w-4 h-4" /> <span className="hidden sm:inline">AI Matches</span>
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
              {activeTab === 'posted-jobs' && <PostedJobs jobs={jobs} onDeleteJob={handleDeleteJob} />}
              {activeTab === 'create-job' && <CreateJobPost onCreateJob={handleCreateJob} recruiterName={userName} />}
              {activeTab === 'candidates' && <CandidateMatches jobs={jobs} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}