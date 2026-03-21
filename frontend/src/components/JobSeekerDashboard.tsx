import { useState } from 'react';
import { Brain, LogOut, User, TrendingUp, Target, Briefcase, FileSearch } from 'lucide-react';
import { SkillProfile } from './SkillProfile';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { CareerPathView } from './CareerPathView';
import { JobRecommendations } from './JobRecommendations';
import { ResumeAnalyzer } from './ResumeAnalyzer';
import { Skill } from '../App';

interface JobSeekerDashboardProps {
  userName: string;
  onLogout: () => void;
}

type Tab = 'profile' | 'resume-analyzer' | 'gap-analysis' | 'career-path' | 'job-recommendations';

// Default skills to start with
const defaultSkills: Skill[] = [
  { name: 'JavaScript', level: 85, category: 'Programming' },
  { name: 'React', level: 80, category: 'Frontend' },
  { name: 'Python', level: 70, category: 'Programming' },
  { name: 'SQL', level: 65, category: 'Database' },
  { name: 'Git', level: 75, category: 'Tools' },
  { name: 'HTML/CSS', level: 90, category: 'Frontend' },
];

export function JobSeekerDashboard({ userName, onLogout }: JobSeekerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Skills state lifted here — shared across ALL tabs
  const [skills, setSkills] = useState<Skill[]>(defaultSkills);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <span className="text-2xl text-purple-900">SkillNuron AI</span>
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
        <div className="bg-white rounded-xl shadow-sm mb-8 p-2 overflow-x-auto">
          <div className="flex md:grid md:grid-cols-5 gap-2 min-w-max md:min-w-0">
            {[
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'resume-analyzer', icon: FileSearch, label: 'Resume Analyzer' },
              { id: 'gap-analysis', icon: Target, label: 'Gap Analysis' },
              { id: 'career-path', icon: TrendingUp, label: 'Career Path' },
              { id: 'job-recommendations', icon: Briefcase, label: 'Jobs' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as Tab)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area — skills passed as props to all tabs */}
        <div>
          {activeTab === 'profile' && (
            <SkillProfile skills={skills} setSkills={setSkills} />
          )}
          {activeTab === 'resume-analyzer' && <ResumeAnalyzer />}
          {activeTab === 'gap-analysis' && (
            <SkillGapAnalysis skills={skills} />
          )}
          {activeTab === 'career-path' && (
            <CareerPathView skills={skills} />
          )}
          {activeTab === 'job-recommendations' && <JobRecommendations />}
        </div>
      </div>
    </div>
  );
}