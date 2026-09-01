import { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, Loader2, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { getCareerPath } from '../services/api';
import { Skill } from '../App';

interface CareerPathViewProps {
  skills: Skill[];
  savedRole?: string;
}

export function CareerPathView({ skills, savedRole }: CareerPathViewProps) {
  const [targetRole, setTargetRole] = useState(savedRole || '');

  useEffect(() => {
    if (savedRole && !targetRole) {
      setTargetRole(savedRole);
    }
  }, [savedRole]);
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [experienceYears, setExperienceYears] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const getLevelColor = (level: string) => {
    if (level?.toLowerCase().includes('junior')) return 'bg-success/20 text-success';
    if (level?.toLowerCase().includes('mid')) return 'bg-info/20 text-info';
    if (level?.toLowerCase().includes('senior')) return 'bg-primary/20 text-primary';
    return 'bg-base-200 text-base-content/80';
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
      <div className="bg-linear-to-r from-primary to-secondary text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-base-100/20 rounded-lg flex items-center justify-center shrink-0">
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
      <div className="bg-base-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-base-content mb-3">Your Current Skills ({skills.length})</h3>
        {skills.length === 0 ? (
          <p className="text-sm text-warning bg-warning/10 p-3 rounded-lg">
            ⚠️ No skills found. Go to the <strong>Profile</strong> tab and add your skills first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.name} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">
                {skill.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Feature Purpose Banner */}
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div>
          <h4 className="text-accent font-medium text-sm">Tool Purpose: The Roadmap</h4>
          <p className="text-accent text-sm mt-1">This tool plots your step-by-step timeline, salary progression, and milestones over the coming months and years.</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-base-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-base-content mb-1">Tell us about your goal</h3>
        {savedRole && <p className="text-xs text-primary mb-4 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Auto-loaded from your profile</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-base-content/70 mb-1">Target Role</label>
            <input
              type="text"
              placeholder="e.g. Full Stack Developer, Data Scientist, ML Engineer..."
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGetCareerPath()}
              className="w-full px-4 py-3 border border-base-300 rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Experience Level Dropdown */}
            <div>
              <label className="block text-sm text-base-content/70 mb-1">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={e => {
                  const level = e.target.value;
                  setExperienceLevel(level);
                  // Auto-update years based on level selection
                  if (level === 'Fresher') setExperienceYears(0);
                  if (level === 'Intermediate') setExperienceYears(2);
                  if (level === 'Experienced') setExperienceYears(5);
                }}
                className="w-full px-4 py-3 border border-base-300 rounded-lg focus:outline-none focus:border-primary bg-base-100"
              >
                <option value="Fresher">Fresher</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>

            {/* Exact Years Input */}
            <div>
              <label className="block text-sm text-base-content/70 mb-1">Years of Experience</label>
              <input
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={e => {
                  const years = Number(e.target.value);
                  setExperienceYears(years);
                  // Auto-update dropdown based on typed years
                  if (years <= 2) setExperienceLevel('Fresher');
                  else if (years <= 5) setExperienceLevel('Intermediate');
                  else setExperienceLevel('Experienced');
                }}
                className="w-full px-4 py-3 border border-base-300 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={handleGetCareerPath}
            disabled={isLoading}
            className="w-full py-3 bg-linear-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
            ⚠️ {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-4 flex items-center gap-3 text-primary">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm">Groq AI is building your personalised roadmap... 3–5 seconds</span>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Summary Banner */}
          <div className="bg-info/10 border border-info/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <div>
                <h4 className="text-info mb-1">
                  Recommended Path: <strong>{result.recommended_path}</strong>
                </h4>
                <p className="text-sm text-info">
                  Total timeline to reach your goal: <strong>{result.total_timeline}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Career Path Steps */}
          {result.career_paths?.length > 0 && (
            <div className="bg-base-100 rounded-xl p-6 shadow-sm">
              <h3 className="text-xl text-base-content mb-6">Your Career Roadmap</h3>
              <div className="space-y-4">
                {result.career_paths.map((path: any, index: number) => (
                  <div key={index}>
                    <div className="border border-base-300 rounded-xl p-5 hover:shadow-md ">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h4 className="text-lg text-base-content">{path.role}</h4>
                            <span className={`px-3 py-1 text-xs rounded-full ${getLevelColor(path.level)}`}>
                              {path.level}
                            </span>
                          </div>
                          {path.description && (
                            <p className="text-sm text-base-content/70 mb-3">{path.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>{path.timeline}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-success font-medium text-base">₹</span>
                              <span>{path.averageSalary}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Required Skills */}
                      {path.requiredSkills?.length > 0 && (
                        <div>
                          <p className="text-xs text-base-content/60 mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Required skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {path.requiredSkills.map((skill: string, i: number) => (
                              <span
                                key={i}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
                                    ? 'bg-success/20 text-success'
                                    : 'bg-base-200 text-base-content/70'
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-base-content/50 mt-2">
                            🟢 Green = you already have this skill
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Arrow between steps */}
                    {index < result.career_paths.length - 1 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="w-5 h-5 text-primary/60 rotate-90" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next Steps */}
          {result.next_steps?.length > 0 && (
            <div className="bg-linear-to-r from-info/10 to-primary/10 rounded-xl p-6 border border-info/30">
              <h3 className="text-xl text-base-content mb-4">Immediate Next Steps</h3>
              <div className="space-y-3">
                {result.next_steps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shrink-0 text-sm">
                      {index + 1}
                    </div>
                    <p className="text-base-content/80 pt-1">{step}</p>
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