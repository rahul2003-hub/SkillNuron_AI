import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertCircle, BookOpen, CheckCircle, Loader2, Sparkles, Target } from 'lucide-react';
import { analyzeSkillGap } from '../services/api';
import { Skill } from '../App';

interface SkillGapAnalysisProps {
  skills: Skill[];
  savedRole?: string;
  setActiveTab?: (tab: any) => void;
}

export function SkillGapAnalysis({ skills, savedRole, setActiveTab }: SkillGapAnalysisProps) {
  const [targetRole, setTargetRole] = useState(savedRole || '');

  useEffect(() => {
    if (savedRole && !targetRole) {
      setTargetRole(savedRole);
    }
  }, [savedRole]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAnalyze = async () => {
    if (!targetRole.trim()) {
      setError('Please enter a target role');
      return;
    }
    if (skills.length === 0) {
      setError('Please add your skills in the Profile tab first');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const skillNames = skills.map(s => s.name);
      const data = await analyzeSkillGap(skillNames, targetRole);
      setResult(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Make sure your backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-2">AI-Powered Skill Gap Analysis</h2>
            <p className="opacity-90">
              Enter your target role and our AI will analyze the gap between your current skills and what's needed.
            </p>
          </div>
        </div>
      </div>

      {/* Current Skills Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-gray-900 mb-3">Your Current Skills ({skills.length})</h3>
        {skills.length === 0 ? (
          <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
            ⚠️ No skills added yet. Go to the <strong>Profile</strong> tab and add your skills first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.name} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {skill.name} · {skill.level}%
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Feature Purpose Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <Target className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-indigo-900 font-medium text-sm">Tool Purpose: The Skills Audit</h4>
          <p className="text-indigo-800 text-sm mt-1">This tool compares your current skills directly against role requirements to find exactly what you're missing. (For timeline and salary, use Career Path).</p>
        </div>
      </div>

      {/* Target Role Input */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-gray-900 mb-1">What role are you targeting?</h3>
        {savedRole && <p className="text-xs text-purple-600 mb-4 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Auto-loaded from your profile</p>}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Full Stack Developer, Data Scientist, DevOps Engineer..."
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-4 flex items-center gap-3 text-purple-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm">Groq AI is analyzing your skill gap... this takes 3–5 seconds</span>
          </div>
        )}
      </div>

      {/* AI Results */}
      {result && (
        <>
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-900 mb-1">AI Summary</h4>
                <p className="text-sm text-blue-800">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-gray-600">Critical Gaps</span>
              </div>
              <p className="text-3xl text-gray-900">
                {result.missing_skills?.filter((g: any) => g.priority === 'high').length || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-600">Growth Areas</span>
              </div>
              <p className="text-3xl text-gray-900">
                {result.missing_skills?.filter((g: any) => g.priority === 'medium').length || 0}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span className="text-gray-600">Resources Found</span>
              </div>
              <p className="text-3xl text-gray-900">
                {result.learning_resources?.length || 0}
              </p>
            </div>
          </div>

          {/* Skill Gaps */}
          {result.missing_skills?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl text-gray-900 mb-6">Identified Skill Gaps</h3>
              <div className="space-y-4">
                {result.missing_skills.map((gap: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg text-gray-900">{gap.skill}</h4>
                          <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(gap.priority)}`}>
                            {gap.priority?.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{gap.recommendation}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Current: {gap.currentLevel}%</span>
                          <span className="text-gray-600">Target: {gap.targetLevel}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${gap.currentLevel}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Resources */}
          {result.learning_resources?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl text-gray-900">Recommended Learning Resources</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {result.learning_resources.map((resource: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-gray-900">{resource.title}</h4>
                      <CheckCircle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-purple-600 mb-2">{resource.skill}</p>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{resource.platform}</span>
                      <span>{resource.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nudge to Career Path */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center mb-6">
            <h3 className="text-purple-900 font-medium mb-2">Ready to see your long-term roadmap?</h3>
            <p className="text-purple-700 text-sm mb-4">Now that you know your gaps, plot your salary and timeline.</p>
            <button 
              onClick={() => setActiveTab && setActiveTab('career-path')}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Go to Career Path →
            </button>
          </div>

          {/* Action Plan */}
          {result.action_plan?.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-xl text-gray-900 mb-4">Your AI Learning Action Plan</h3>
              <div className="space-y-3">
                {result.action_plan.map((step: string, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}