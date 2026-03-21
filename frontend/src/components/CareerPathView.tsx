import { useState } from 'react';
import { TrendingUp, Clock, Target, Loader2, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { getCareerPath } from '../services/api';
import { Skill } from '../App';

interface CareerPathViewProps {
  skills: Skill[];
}

export function CareerPathView({ skills }: CareerPathViewProps) {
  const [targetRole, setTargetRole] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const getLevelColor = (level: string) => {
    if (level?.toLowerCase().includes('junior')) return 'bg-green-100 text-green-700';
    if (level?.toLowerCase().includes('mid')) return 'bg-blue-100 text-blue-700';
    if (level?.toLowerCase().includes('senior')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const handleGetCareerPath = async () => {
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
      const data = await getCareerPath(skillNames, experienceYears, targetRole);
      setResult(data.recommendation);
    } catch (err: any) {
      setError(err.message || 'Failed to get career path. Make sure your backend is running.');
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
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-2">AI Career Path Recommender</h2>
            <p className="opacity-90">
              Get a personalised career roadmap based on your current skills and experience.
            </p>
          </div>
        </div>
      </div>

      {/* Current Skills */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-gray-900 mb-3">Your Current Skills ({skills.length})</h3>
        {skills.length === 0 ? (
          <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
            ⚠️ No skills found. Go to the <strong>Profile</strong> tab and add your skills first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.name} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-gray-900 mb-4">Tell us about your goal</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Target Role</label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer, Data Scientist, ML Engineer..."
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGetCareerPath()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Years of Experience: <strong>{experienceYears} {experienceYears === 1 ? 'year' : 'years'}</strong>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={experienceYears}
              onChange={e => setExperienceYears(Number(e.target.value))}
              className="w-full accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 (Fresher)</span>
              <span>5 years</span>
              <span>10 years</span>
              <span>15+ years</span>
            </div>
          </div>

          <button
            onClick={handleGetCareerPath}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is building your roadmap...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get My Career Path
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

        {isLoading && (
          <div className="mt-4 flex items-center gap-3 text-purple-600">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm">Groq AI is building your personalised roadmap... 3–5 seconds</span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-900 mb-1">
                  Recommended Path: <strong>{result.recommended_path}</strong>
                </h4>
                <p className="text-sm text-blue-800">
                  Total timeline to reach your goal: <strong>{result.total_timeline}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Career Path Steps */}
          {result.career_paths?.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-xl text-gray-900 mb-6">Your Career Roadmap</h3>
              <div className="space-y-4">
                {result.career_paths.map((path: any, index: number) => (
                  <div key={index}>
                    <div className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-lg text-gray-900">{path.role}</h4>
                            <span className={`px-3 py-1 text-xs rounded-full ${getLevelColor(path.level)}`}>
                              {path.level}
                            </span>
                          </div>
                          {path.description && (
                            <p className="text-sm text-gray-600 mb-3">{path.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-purple-500" />
                              <span>{path.timeline}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-green-500 font-medium text-base">₹</span>
                              <span>{path.averageSalary}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Required Skills */}
                      {path.requiredSkills?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Required skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {path.requiredSkills.map((skill: string, i: number) => (
                              <span
                                key={i}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            🟢 Green = you already have this skill
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Arrow between steps */}
                    {index < result.career_paths.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="w-5 h-5 text-purple-400 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result.next_steps?.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-xl text-gray-900 mb-4">Immediate Next Steps</h3>
              <div className="space-y-3">
                {result.next_steps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 pt-1">{step}</p>
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