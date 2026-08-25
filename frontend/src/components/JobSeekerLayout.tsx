import { useState, useEffect } from 'react';
import { Brain, LogOut, User, TrendingUp, Target, Briefcase, FileSearch, Menu, ChevronLeft, LayoutDashboard, ClipboardList } from 'lucide-react';
import { SkillProfile } from './SkillProfile';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { CareerPathView } from './CareerPathView';
import { JobRecommendations } from './JobRecommendations';
import { ResumeAnalyzer } from './ResumeAnalyzer';
import { Skill } from '../App';
import { PsychometricTest } from './PsychometricTest';
import { NotificationBell } from './NotificationBell';
import { JobSeekerHome } from './JobSeekerHome';
import { MyApplications } from './MyApplications';

import { getProfile, getSkills } from '../services/api';

type Tab = 'home' | 'profile' | 'assessment' | 'resume-analyzer' | 'gap-analysis' | 'career-path' | 'job-recommendations' | 'my-applications';

// Renamed interface to match the layout expected by App.tsx
interface JobSeekerLayoutProps {
  userName: string;
  userId: string;
  userEmail: string;
  onLogout: () => void;
}

const defaultSkills: Skill[] = [];

// Renamed function to JobSeekerLayout to fix the App.tsx import error
export function JobSeekerLayout({ userName, userId, userEmail, onLogout }: JobSeekerLayoutProps) {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);
  const [primaryRole, setPrimaryRole] = useState<string>('');

  useEffect(() => {
    if (userId) {
      getSkills(userId)
        .then(data => {
          if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
            setSkills(data.skills);
          }
        })
        .catch(err => console.error("Failed to load saved skills:", err));
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'gap-analysis' || activeTab === 'career-path') {
      getProfile(userId).then(data => {
        if (data.profile && data.profile.primary_role) {
          setPrimaryRole(data.profile.primary_role);
        }
      }).catch(console.error);
    }
  }, [activeTab, userId]);

  const navItems = [
    { id: 'home', icon: LayoutDashboard, label: 'Home' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'assessment', icon: Brain, label: 'Assessment' },
    { id: 'resume-analyzer', icon: FileSearch, label: 'Resume Analyzer' },

    { id: 'gap-analysis', icon: Target, label: 'Gap Analysis' },
    { id: 'career-path', icon: TrendingUp, label: 'Career Path' },
    { id: 'job-recommendations', icon: Briefcase, label: 'Jobs' },
    { id: 'my-applications', icon: ClipboardList, label: 'My Applications' },
  ];

  return (
    <div className="fixed inset-0 flex bg-base-200 font-sans overflow-hidden">

      <aside
        className={`h-full bg-base-100 border-r border-base-300 flex flex-col transition-all duration-300 ease-in-out relative z-20 shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        <div className={`h-16 flex items-center border-b border-base-300 shrink-0 transition-all duration-300 ${isSidebarOpen ? 'justify-between px-4' : 'justify-center'
          }`}>
          {isSidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <Brain className="w-8 h-8 text-primary shrink-0" />
              <span className="text-xl font-bold text-base-content tracking-tight">
                SkillNuron <span className="text-primary">AI</span>
              </span>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-base-200 text-base-content/50 transition-colors shrink-0 outline-none"
          >
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
                className={`flex items-center transition-all duration-200 group ${isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-base-content/60 hover:bg-base-200 hover:text-base-content'
                  } ${isSidebarOpen
                    ? 'w-full px-4 py-3 rounded-xl justify-start'
                    : 'w-12 h-12 justify-center rounded-xl mx-auto'
                  }`}
                title={!isSidebarOpen ? label : ''}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'text-base-content/40 group-hover:text-base-content/60'
                  }`} />
                {isSidebarOpen && <span className="ml-3 truncate whitespace-nowrap">{label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-base-300 shrink-0 bg-base-100">
          <button
            onClick={onLogout}
            className={`flex items-center transition-all duration-200 group text-base-content/60 hover:bg-error/10 hover:text-error ${isSidebarOpen
              ? 'w-full px-4 py-3 rounded-xl justify-start'
              : 'w-12 h-12 justify-center rounded-xl mx-auto'
              }`}
            title={!isSidebarOpen ? "Logout" : ""}
          >
            <LogOut className="w-5 h-5 shrink-0 text-base-content/40 group-hover:text-error transition-colors" />
            {isSidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative z-10 bg-base-200">

        <header className="flex-none h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-6 lg:px-10 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-base-content capitalize tracking-tight">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-base-content/50 font-medium uppercase tracking-wider">Welcome back</p>
              <p className="text-sm font-bold text-base-content">{userName}</p>
            </div>
            <NotificationBell />
            <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-content font-bold shadow-md border-2 border-base-100">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth">
          <div className="max-w-6xl mx-auto pb-8">
            {activeTab === 'home' && (
              <JobSeekerHome userId={userId} userName={userName} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'profile' && (
              <SkillProfile skills={skills} setSkills={setSkills} userId={userId} userName={userName} userEmail={userEmail} />
            )}
            {activeTab === 'resume-analyzer' && <ResumeAnalyzer userId={userId} />}
            {activeTab === 'gap-analysis' && (
              <SkillGapAnalysis skills={skills} savedRole={primaryRole} setActiveTab={setActiveTab} />
            )}
            {activeTab === 'career-path' && (
              <CareerPathView skills={skills} savedRole={primaryRole} />
            )}
            {activeTab === 'job-recommendations' && <JobRecommendations />}
            {activeTab === 'assessment' && <PsychometricTest />}
            {activeTab === 'my-applications' && <MyApplications />}
          </div>
        </div>
      </main>

    </div>
  );
}