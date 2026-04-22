import { useState, useEffect } from 'react';
import { Brain, LogOut, User, TrendingUp, Target, Briefcase, FileSearch, Menu, ChevronLeft, LayoutDashboard, Settings } from 'lucide-react';
import { SkillProfile } from './SkillProfile';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { CareerPathView } from './CareerPathView';
import { JobRecommendations } from './JobRecommendations';
import { ResumeAnalyzer } from './ResumeAnalyzer';
import { PsychometricTest } from './PsychometricTest';
import { JobSeekerDashboard } from './JobSeekerDashboard';
import { Skill } from '../App';
import { getProfile } from '../services/api';

interface JobSeekerLayoutProps {
  userName: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

type Tab = 'dashboard' | 'profile' | 'resume-analyzer' | 'gap-analysis' | 'career-path' | 'job-recommendations' | 'assessment';

const defaultSkills: Skill[] = [
  { name: 'JavaScript', level: 85, category: 'Programming' },
  { name: 'React', level: 80, category: 'Frontend' },
  { name: 'Python', level: 70, category: 'Programming' },
  { name: 'SQL', level: 65, category: 'Database' },
  { name: 'Git', level: 75, category: 'Tools' },
  { name: 'HTML/CSS', level: 90, category: 'Frontend' },
];

export function JobSeekerLayout({ userName, userId, userEmail, onLogout }: JobSeekerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);
  const [primaryRole, setPrimaryRole] = useState<string>('');

  useEffect(() => {
    getProfile(userId).then(data => {
      if (data.profile && data.profile.primary_role) {
        setPrimaryRole(data.profile.primary_role);
      }
    }).catch(console.error);
  }, [userId, activeTab]); 

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'assessment', icon: Brain, label: 'Assessment' },
    { id: 'resume-analyzer', icon: FileSearch, label: 'Resume Analyzer' },
    { id: 'gap-analysis', icon: Target, label: 'Gap Analysis' },
    { id: 'career-path', icon: TrendingUp, label: 'Career Path' },
    { id: 'job-recommendations', icon: Briefcase, label: 'Jobs' },
  ];

  return (
    <div className="h-full w-full flex bg-gray-50 font-sans overflow-hidden">
      
      <aside className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out relative z-20 flex-shrink-0 ${
        isSidebarOpen ? 'w-64' : 'w-20'
      }`}>
        <div className={`h-16 flex items-center border-b border-gray-100 flex-shrink-0 transition-all duration-300 ${
          isSidebarOpen ? 'justify-between px-4' : 'justify-center'
        }`}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <Brain className="w-8 h-8 text-purple-600 flex-shrink-0" />
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                SkillNuron <span className="text-purple-600">AI</span>
              </span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0 outline-none">
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-2">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`flex items-center transition-all duration-200 group ${
                  isActive ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } ${isSidebarOpen ? 'w-full px-4 py-3 rounded-xl justify-start' : 'w-12 h-12 justify-center rounded-xl mx-auto'}`}
                title={!isSidebarOpen ? label : ''}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                {isSidebarOpen && <span className="ml-3 truncate whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className={`p-4 border-t border-gray-100 flex-shrink-0 bg-white flex flex-col gap-2 transition-all duration-300 ${!isSidebarOpen && 'items-center px-0'}`}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center transition-all duration-200 group ${
              activeTab === 'profile' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            } ${isSidebarOpen ? 'w-full px-4 py-3 rounded-xl justify-start' : 'w-12 h-12 justify-center rounded-xl mx-auto'}`}
            title={!isSidebarOpen ? "Profile & Settings" : ""}
          >
            <Settings className={`w-5 h-5 flex-shrink-0 transition-colors ${activeTab === 'profile' ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`} />
            {isSidebarOpen && <span className="ml-3 truncate whitespace-nowrap">Profile & Settings</span>}
          </button>
          <button
            onClick={onLogout}
            className={`flex items-center transition-all duration-200 group text-gray-600 hover:bg-red-50 hover:text-red-600 ${
              isSidebarOpen ? 'w-full px-4 py-3 rounded-xl justify-start' : 'w-12 h-12 justify-center rounded-xl mx-auto'
            }`}
            title={!isSidebarOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors" />
            {isSidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative z-10 bg-gray-50">
        <header className="flex-none h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 lg:px-10 z-10">
          <h1 className="text-xl font-semibold text-gray-800 capitalize tracking-tight">
            {activeTab === 'profile' ? 'Profile & Settings' : activeTab.replace('-', ' ')}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Welcome back</p>
              <p className="text-sm font-bold text-gray-900">{userName}</p>
            </div>
            <div 
              onClick={() => setActiveTab('profile')}
              className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white cursor-pointer hover:scale-105 transition-transform"
              title="Go to Profile"
            >
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 h-full overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <JobSeekerDashboard userName={userName} primaryRole={primaryRole} skillsCount={skills.length} onNavigate={setActiveTab} />
            )}
            {activeTab === 'profile' && (
              <SkillProfile skills={skills} setSkills={setSkills} userId={userId} userName={userName} userEmail={userEmail} />
            )}
            {activeTab === 'resume-analyzer' && <ResumeAnalyzer />}
            {activeTab === 'gap-analysis' && <SkillGapAnalysis skills={skills} savedRole={primaryRole} setActiveTab={setActiveTab} />}
            {activeTab === 'career-path' && <CareerPathView skills={skills} savedRole={primaryRole} />}
            {activeTab === 'job-recommendations' && <JobRecommendations />}
            {activeTab === 'assessment' && <PsychometricTest />}
          </div>
        </div>
      </main>
    </div>
  );
}