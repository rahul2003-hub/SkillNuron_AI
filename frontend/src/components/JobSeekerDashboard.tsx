import { ArrowRight, Target, Brain, FileSearch, TrendingUp, Award, Zap, Sparkles, Briefcase } from 'lucide-react';

interface JobSeekerDashboardProps {
  userName: string;
  primaryRole: string;
  skillsCount: number;
  onNavigate: (tab: any) => void;
}

export function JobSeekerDashboard({ userName, primaryRole, skillsCount, onNavigate }: JobSeekerDashboardProps) {
  const profileStrength = 20 + (skillsCount > 0 ? 40 : 0) + (primaryRole ? 40 : 0);

  const quickTools = [
    {
      id: 'assessment',
      title: 'Tech Persona Assessment',
      description: 'Discover your ideal tech career path and work environment.',
      icon: Brain,
      color: 'bg-purple-100 text-purple-600',
      border: 'hover:border-purple-300',
    },
    {
      id: 'resume-analyzer',
      title: 'ATS Resume Analyzer',
      description: 'Scan your resume against industry standards and missing keywords.',
      icon: FileSearch,
      color: 'bg-blue-100 text-blue-600',
      border: 'hover:border-blue-300',
    },
    {
      id: 'gap-analysis',
      title: 'Skill Gap Analysis',
      description: 'Compare your current skills against your dream job requirements.',
      icon: Target,
      color: 'bg-pink-100 text-pink-600',
      border: 'hover:border-pink-300',
    },
    {
      id: 'career-path',
      title: 'AI Career Roadmap',
      description: 'Generate a step-by-step timeline and salary projection.',
      icon: TrendingUp,
      color: 'bg-teal-100 text-teal-600',
      border: 'hover:border-teal-300',
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner - Buggy background blurs removed! */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-purple-100 text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-300 flex-shrink-0" />
            {primaryRole 
              ? <span>Working towards your goal of becoming a <strong className="text-white">{primaryRole}</strong></span>
              : <span>Ready to accelerate your tech career journey?</span>
            }
          </p>
          
          {!primaryRole && (
            <button 
              onClick={() => onNavigate('profile')}
              className="mt-6 px-6 py-2.5 bg-white text-purple-700 font-medium rounded-lg hover:shadow-lg transition-all"
            >
              Complete Your Profile
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Profile Strength</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold text-gray-900">{profileStrength}%</span>
              <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${profileStrength}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Award className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Verified Skills</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{skillsCount} <span className="text-sm font-normal text-gray-400">added</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-orange-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-500 font-medium">Active Goal</p>
            <p className="text-lg font-bold text-gray-900 mt-1 truncate">
              {primaryRole || "Not Set"}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Tools Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Explore AI Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickTools.map((tool) => (
            <div 
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className={`bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${tool.border} group`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${tool.color}`}>
                  <tool.icon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-600 transition-colors transform group-hover:translate-x-1" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{tool.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{tool.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mini Job Teaser */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Ready to start applying?</h3>
            <p className="text-sm text-gray-500">We have curated job matches based on your skills.</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('job-recommendations')}
          className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors whitespace-nowrap w-full sm:w-auto"
        >
          View Job Matches
        </button>
      </div>
    </div>
  );
}