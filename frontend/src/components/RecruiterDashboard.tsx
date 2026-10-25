import { useState, useEffect } from 'react';
import { Brain, LogOut, Plus, Briefcase, Users, TrendingUp, FileText, BarChart3, Sun, Moon, Menu, ChevronLeft, UserSearch } from 'lucide-react';
import { toast } from 'sonner';
import { PostedJobs } from './PostedJobs';
import { CreateJobPost } from './CreateJobPost';
import { RecruiterAnalyticsCharts } from './RecruiterAnalyticsCharts';
import { RecruiterCandidates } from './RecruiterCandidates';
import { NotificationBell } from './NotificationBell';
import { DeleteAccountButton } from './DeleteAccountButton';
import { JobPosting, isDarkTheme, setTheme } from '../App';
import { getMyJobs, getRecruiterAnalytics, deleteJob } from '../services/api';

interface RecruiterDashboardProps {
  userName: string;
  userId: string;
  onLogout: () => void;
}

type Tab = 'posted-jobs' | 'create-job' | 'candidates' | 'analytics';

export function RecruiterDashboard({ userName, userId, onLogout }: RecruiterDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posted-jobs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navItems = [
    { id: 'posted-jobs', icon: Briefcase, label: 'My Jobs' },
    { id: 'create-job', icon: Plus, label: 'Post New Job' },
    { id: 'candidates', icon: UserSearch, label: 'Candidates' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  ] as const;
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
        const jobsData = await getMyJobs();
        if (jobsData.success && Array.isArray(jobsData.jobs)) {
          setJobs(jobsData.jobs);
        }

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
      toast.success('Job deleted');
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  return (
    <div className="fixed inset-0 flex bg-base-200 font-sans overflow-hidden">
      <aside className={`h-full bg-base-100 border-r border-base-300 flex flex-col shrink-0 ${isSidebarOpen ? 'w-64 max-sm:w-20' : 'w-20'}`}>
        <div className={`h-16 flex items-center border-b border-base-300 shrink-0 ${isSidebarOpen ? 'justify-between px-4 max-sm:justify-center' : 'justify-center'}`}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2 whitespace-nowrap max-sm:hidden">
              <Brain className="w-8 h-8 text-primary shrink-0" />
              <span className="text-xl font-bold tracking-tight">SkillNuron <span className="text-primary">AI</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 max-sm:hidden" aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'} aria-expanded={isSidebarOpen}>
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Brain className="w-8 h-8 text-primary sm:hidden" />
        </div>
        <nav aria-label="Recruiter navigation" className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} title={label} aria-label={label} aria-current={activeTab === id ? 'page' : undefined}
              className={`flex items-center rounded-xl py-3 ${isSidebarOpen ? 'w-full px-4 max-sm:px-0 max-sm:justify-center' : 'w-12 h-12 justify-center mx-auto'} ${activeTab === id ? 'bg-primary/10 text-primary font-medium' : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'}`}>
              <Icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="ml-3 truncate whitespace-nowrap max-sm:hidden">{label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-base-300 shrink-0">
          <button onClick={onLogout} title="Logout" aria-label="Logout" className={`flex items-center rounded-xl text-base-content/60 hover:bg-error/10 hover:text-error ${isSidebarOpen ? 'w-full px-4 py-3 max-sm:px-0 max-sm:justify-center' : 'w-12 h-12 justify-center mx-auto'}`}>
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && <span className="ml-3 font-medium max-sm:hidden">Logout</span>}
          </button>
          <div className="mt-2 flex justify-center">
            <DeleteAccountButton accountType="recruiter" onDeleted={onLogout} />
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-4 sm:px-6 lg:px-10">
          <h1 className="text-base sm:text-xl font-semibold text-base-content tracking-tight">{navItems.find(item => item.id === activeTab)?.label}</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-base-content/50 font-medium uppercase tracking-wider">Welcome back</p>
              <p className="text-sm font-bold text-base-content">{userName}</p>
            </div>

            {/* Theme Controller Button */}
            <label className="swap btn btn-ghost btn-circle" title="Toggle dark mode">
              <input type="checkbox" className="theme-controller" value="dark" defaultChecked={isDarkTheme()} onChange={(e) => setTheme(e.currentTarget.checked)} aria-label="Toggle dark mode" />
              <Sun className="swap-off w-5 h-5" aria-hidden="true" />
              <Moon className="swap-on w-5 h-5" aria-hidden="true" />
            </label>

            <NotificationBell />
            <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-full hidden sm:flex items-center justify-center text-primary-content font-bold shadow-md border-2 border-base-100">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-8 lg:p-12 scroll-smooth">
          <div className={`${activeTab === 'candidates' ? 'max-w-none' : 'max-w-6xl'} mx-auto pb-8`}>

        {/* Analytics KPI Row */}
        {activeTab !== 'create-job' && activeTab !== 'candidates' && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <div className="bg-base-100 p-6 rounded-xl shadow-sm border border-base-300 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg text-primary"><Briefcase className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-base-content/60 font-medium">Total Jobs</p>
              <p className="text-2xl font-bold text-base-content">{jobs.length}</p>
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
        </div>}

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
              {activeTab === 'candidates' && <RecruiterCandidates />}
              {activeTab === 'analytics' && <RecruiterAnalyticsCharts jobs={jobs} skillDemand={analytics.skill_demand} matchScoreDistribution={analytics.match_score_distribution} />}
            </>
          )}
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}
