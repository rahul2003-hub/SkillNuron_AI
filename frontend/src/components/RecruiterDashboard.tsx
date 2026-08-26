import { useState, useEffect } from 'react';
import { Brain, LogOut, Plus, Briefcase, Users, TrendingUp, FileText, Star, BarChart3 } from 'lucide-react';
import { PostedJobs } from './PostedJobs';
import { CreateJobPost } from './CreateJobPost';
import { CandidateMatches } from './CandidateMatches';
import { RecruiterAnalyticsCharts } from './RecruiterAnalyticsCharts';
import { NotificationBell } from './NotificationBell';
import { JobPosting } from '../App';
import { getMyJobs, getRecruiterAnalytics, deleteJob } from '../services/api';

interface RecruiterDashboardProps {
  userName: string;
  userId: string;
  onLogout: () => void;
}

type Tab = 'posted-jobs' | 'create-job' | 'candidates' | 'analytics';

export function RecruiterDashboard({ userName, userId, onLogout }: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posted-jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Recruiter Analytics
  const [analytics, setAnalytics] = useState({
    total_jobs: 0,
    total_candidates: 0,
    average_resume_score: 0,
    top_skills: [] as { skill: string, count: number }[],
    skill_demand: [] as { skill: string, count: number }[],
    match_score_distribution: [] as { range: string, count: number }[]
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // 1. Fetch jobs for this recruiter — filtered server-side by
        // posted_by_id (stable FK), not by display name. Fixes the old
        // bug where postedBy === userName broke on name collisions/renames.
        const jobsData = await getMyJobs();
        if (jobsData.success && Array.isArray(jobsData.jobs)) {
          setJobs(jobsData.jobs);
        }

        // 2. Fetch Analytics
        const analyticsData = await getRecruiterAnalytics();
        if (analyticsData) {
          setAnalytics({
            total_jobs: analyticsData.total_jobs ?? 0,
            total_candidates: analyticsData.total_candidates ?? 0,
            average_resume_score: analyticsData.average_resume_score ?? 0,
            top_skills: analyticsData.top_skills ?? [],
            skill_demand: analyticsData.skill_demand ?? [],
            match_score_distribution: analyticsData.match_score_distribution ?? []
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleCreateJob = (job: JobPosting) => {
    setJobs([job, ...jobs]);
    setActiveTab('posted-jobs');
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteJob(jobId);
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
      alert("Failed to delete job.");
    }
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <header className="bg-base-100 border-b border-base-300 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-primary">SkillNuron AI</span>
            <span className="hidden sm:inline px-3 py-1 bg-secondary/20 text-secondary text-sm rounded-full font-medium ml-2">Recruiter</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-base-content/60">Welcome back,</p>
              <p className="text-base-content font-semibold">{userName}</p>
            </div>
            <NotificationBell />
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 text-base-content/70 hover:bg-base-200 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">

        {/* Analytics KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><Briefcase className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-base-content/60 font-medium">Total Jobs</p>
              <p className="text-2xl font-bold text-base-content">{analytics.total_jobs}</p>
            </div>
          </div>
          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center gap-4">
            <div className="p-3 bg-info/10 rounded-lg text-info"><Users className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-base-content/60 font-medium">Talent Pool</p>
              <p className="text-2xl font-bold text-base-content">{analytics.total_candidates}</p>
            </div>
          </div>
          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg text-success"><FileText className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-base-content/60 font-medium">Avg Resume Score</p>
              <p className="text-2xl font-bold text-base-content">{analytics.average_resume_score || 0}%</p>
            </div>
          </div>
          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center gap-4">
            <div className="p-3 bg-secondary/10 rounded-lg text-secondary"><TrendingUp className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-base-content/60 font-medium">Top Skill</p>
              <p className="text-lg font-bold text-base-content line-clamp-1">
                {analytics.top_skills.length > 0 ? analytics.top_skills[0].skill : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-base-100 rounded-xl shadow-sm mb-8 p-2 border border-base-300">
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setActiveTab('posted-jobs')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'posted-jobs' ? 'bg-linear-to-r from-primary to-secondary text-primary-content shadow-md' : 'text-base-content/70 hover:bg-base-200'}`}>
              <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">My Jobs</span>
            </button>
            <button onClick={() => setActiveTab('create-job')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'create-job' ? 'bg-linear-to-r from-primary to-secondary text-primary-content shadow-md' : 'text-base-content/70 hover:bg-base-200'}`}>
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Post New Job</span>
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'candidates' ? 'bg-linear-to-r from-primary to-secondary text-primary-content shadow-md' : 'text-base-content/70 hover:bg-base-200'}`}>
              <Star className="w-4 h-4" /> <span className="hidden sm:inline">AI Matches</span>
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${activeTab === 'analytics' ? 'bg-linear-to-r from-primary to-secondary text-primary-content shadow-md' : 'text-base-content/70 hover:bg-base-200'}`}>
              <BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Analytics</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {activeTab === 'posted-jobs' && <PostedJobs jobs={jobs} onDeleteJob={handleDeleteJob} />}
              {activeTab === 'create-job' && <CreateJobPost onCreateJob={handleCreateJob} recruiterName={userName} />}
              {activeTab === 'candidates' && <CandidateMatches jobs={jobs} />}
              {activeTab === 'analytics' && <RecruiterAnalyticsCharts jobs={jobs} skillDemand={analytics.skill_demand} matchScoreDistribution={analytics.match_score_distribution} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}