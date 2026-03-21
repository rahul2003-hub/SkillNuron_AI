import { useState } from 'react';
import { Brain, LogOut, User, TrendingUp, Target, Briefcase, BookOpen, ChevronRight, FileSearch } from 'lucide-react';
import { SkillProfile } from './SkillProfile';
import { SkillGapAnalysis } from './SkillGapAnalysis';
import { CareerPathView } from './CareerPathView';
import { JobRecommendations } from './JobRecommendations';
import { ResumeAnalyzer } from './ResumeAnalyzer';

interface JobSeekerDashboardProps {
  userName: string;
  onLogout: () => void;
}

type Tab = 'profile' | 'resume-analyzer' | 'gap-analysis' | 'career-path' | 'job-recommendations';

export function JobSeekerDashboard({ userName, onLogout }: JobSeekerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

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
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('resume-analyzer')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'resume-analyzer'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              <span className="hidden sm:inline">Resume Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab('gap-analysis')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'gap-analysis'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Gap Analysis</span>
            </button>
            <button
              onClick={() => setActiveTab('career-path')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'career-path'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Career Path</span>
            </button>
            <button
              onClick={() => setActiveTab('job-recommendations')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'job-recommendations'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Jobs</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div>
          {activeTab === 'profile' && <SkillProfile />}
          {activeTab === 'resume-analyzer' && <ResumeAnalyzer />}
          {activeTab === 'gap-analysis' && <SkillGapAnalysis />}
          {activeTab === 'career-path' && <CareerPathView />}
          {activeTab === 'job-recommendations' && <JobRecommendations />}
        </div>
      </div>
    </div>
  );
}