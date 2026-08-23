import { useState, useEffect } from 'react';
import { Brain, ChevronRight, ChevronLeft, CheckCircle, Loader2, Sparkles, RotateCcw, Star, Target, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  options: Option[];
}

interface CareerMatch {
  role: string;
  fit_score: number;
  reason: string;
  indian_companies: string[];
}

interface Profile {
  personality_type: string;
  personality_description: string;
  top_strengths: string[];
  work_style: string;
  ideal_environment: string;
  career_matches: CareerMatch[];
  career_avoid: string[];
  learning_style: string;
  recommended_first_step: string;
  summary: string;
}

export function PsychometricTest() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [result, setResult] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/psychometric/questions`);
      const data = await res.json();
      setQuestions(data.questions);
    } catch {
      setError('Could not load questions. Make sure backend is running.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleOptionSelect = (qId: string, optId: string) => {
    if (optId !== 'E') {
      setAnswers(prev => ({ ...prev, [qId]: optId }));
      // Auto advance after short delay for standard options
      setTimeout(() => {
        if (currentQ < questions.length - 1) {
          setCurrentQ(prev => prev + 1);
        }
      }, 400);
    } else {
      // If they click E, initialize it as 'E: ' so the text box appears, do NOT auto advance
      const currentAnswer = answers[qId] || '';
      if (!currentAnswer.startsWith('E')) {
        setAnswers(prev => ({ ...prev, [qId]: 'E: ' }));
      }
    }
  };

  const handleCustomTextChange = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: `E: ${text}` }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${BASE_URL}/api/psychometric/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setResult(data.analysis); // Make sure this matches backend return (data.analysis)
    } catch (err: any) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setError('');
    setStarted(false);
  };

  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const currentAnswered = questions[currentQ] ? answers[questions[currentQ].id] : null;
  const isLastQuestion = currentQ === questions.length - 1;

  const OPTION_COLORS = [
    'hover:border-primary hover:bg-primary/10',
    'hover:border-info hover:bg-info/10',
    'hover:border-accent hover:bg-accent/10',
    'hover:border-warning hover:bg-warning/10',
    'hover:border-secondary hover:bg-secondary/10', // Option E color
  ];

  const SELECTED_COLORS = [
    'border-primary bg-primary/10 text-primary',
    'border-info bg-info/10 text-info',
    'border-accent bg-accent/10 text-accent',
    'border-warning bg-warning/10 text-warning',
    'border-secondary bg-secondary/10 text-secondary', // Option E selected color
  ];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Welcome Screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-linear-to-r from-primary to-secondary text-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-base-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-3xl mb-3">Tech Career Assessment</h2>
          <p className="opacity-90 text-lg">Discover which tech career role matches your personality and interests.</p>
        </div>

        <div className="bg-base-100 rounded-xl shadow-sm p-6">
          <h3 className="text-base-content text-lg mb-4">What you will discover</h3>
          <div className="space-y-3">
            {[
              { icon: '🧠', text: 'Your tech personality type and core strengths' },
              { icon: '🎯', text: 'Top 3 career roles ranked by fit score' },
              { icon: '🏢', text: 'Indian companies where you would thrive' },
              { icon: '🚀', text: 'Your first concrete step to start this week' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <p className="text-base-content/80 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-info/10 border border-info/30 rounded-xl p-4">
          <p className="text-sm text-info">
            <strong>20 questions · Takes 5 minutes · Tech focused</strong><br />
            Covers: Backend · Frontend · Data · AI/ML · DevOps · Product roles
          </p>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full py-4 bg-linear-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all text-lg flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Start Assessment
        </button>
      </div>
    );
  }

  // Results Screen
  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Personality Header */}
        <div className="bg-linear-to-r from-primary to-secondary text-white rounded-xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-base-100/20 rounded-full flex items-center justify-center shrink-0">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <p className="opacity-75 text-sm mb-1">Your tech personality</p>
              <h2 className="text-3xl mb-3">{result.personality_type}</h2>
              <p className="opacity-90 text-sm">{result.personality_description}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-info/10 border border-info/30 rounded-xl p-5">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-info shrink-0 mt-0.5" />
            <p className="text-sm text-info">{result.summary}</p>
          </div>
        </div>

        {/* Strengths + Work Style */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-warning" />
              <h3 className="text-base-content">Top Strengths</h3>
            </div>
            <div className="space-y-2">
              {result.top_strengths?.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span className="text-sm text-base-content/80">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-base-100 rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-base-content">Work Style</h3>
            </div>
            <p className="text-sm text-base-content/80 mb-4">{result.work_style}</p>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-info" />
              <span className="text-sm font-medium text-base-content">Ideal environment</span>
            </div>
            <p className="text-sm text-base-content/70">{result.ideal_environment}</p>
          </div>
        </div>

        {/* Career Matches */}
        <div className="bg-base-100 rounded-xl shadow-sm p-6">
          <h3 className="text-base-content text-lg mb-6">Your Top Career Matches</h3>
          <div className="space-y-4">
            {result.career_matches?.map((match, i) => (
              <div key={i} className={`border-2 rounded-xl p-5 ${i === 0 ? 'border-primary/40 bg-primary/10' : 'border-base-300'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-base-content font-medium text-lg">{match.role}</span>
                      {i === 0 && (
                        <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full font-medium">
                          ⭐ Best fit
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-base-content/70">{match.reason}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className={`text-3xl font-medium ${i === 0 ? 'text-primary' : 'text-base-content/80'}`}>
                      {match.fit_score}%
                    </div>
                    <div className="text-xs text-base-content/50">fit score</div>
                  </div>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${i === 0 ? 'bg-linear-to-r from-primary to-secondary' : 'bg-base-content/30'}`}
                    style={{ width: `${match.fit_score}%` }}
                  />
                </div>
                {match.indian_companies?.length > 0 && (
                  <div>
                    <p className="text-xs text-base-content/60 mb-2">🏢 Top hiring companies in India</p>
                    <div className="flex flex-wrap gap-2">
                      {match.indian_companies.map((c, j) => (
                        <span key={j} className="px-2 py-1 bg-base-100 border border-base-300 text-base-content/80 rounded-full text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* First Step */}
        {result.recommended_first_step && (
          <div className="bg-success/10 border border-success/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <h4 className="text-success font-medium mb-1">Your recommended first step this week</h4>
                <p className="text-sm text-success">{result.recommended_first_step}</p>
              </div>
            </div>
          </div>
        )}

        {/* Learning Style */}
        <div className="bg-base-100 rounded-xl shadow-sm p-6">
          <h3 className="text-base-content mb-2">How You Learn Best</h3>
          <p className="text-sm text-base-content/80">{result.learning_style}</p>
        </div>

        {/* Roles to avoid */}
        {result.career_avoid?.length > 0 && (
          <div className="bg-error/10 border border-error/20 rounded-xl p-5">
            <h3 className="text-sm font-medium text-base-content mb-3">Roles that may not suit your style</h3>
            <div className="space-y-1">
              {result.career_avoid.map((role, i) => (
                <p key={i} className="text-xs text-error">• {role}</p>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleReset}
          className="w-full py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Retake Assessment
        </button>
      </div>
    );
  }

  // Question Screen
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Progress */}
      <div className="bg-base-100 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-base-content/70">Question {currentQ + 1} of {questions.length}</span>
          <span className="text-sm text-primary font-medium">{progress}% complete</span>
        </div>
        <div className="w-full bg-base-200 rounded-full h-2">
          <div
            className="bg-linear-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Mini dots navigation */}
        <div className="flex gap-1 mt-3 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentQ(i)}
              className={`w-6 h-6 rounded-full text-xs transition-all ${
                i === currentQ
                  ? 'bg-primary text-white'
                  : answers[q.id]
                  ? 'bg-success text-white'
                  : 'bg-base-300 text-base-content/60 hover:bg-base-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      {questions[currentQ] && (
        <div className="bg-base-100 rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-medium text-sm">{currentQ + 1}</span>
            </div>
            <h3 className="text-base-content text-lg leading-snug pt-1">
              {questions[currentQ].question}
            </h3>
          </div>

          <div className="space-y-3">
            {questions[currentQ].options.map((option, i) => {
              const isSelected = currentAnswered === option.id || (option.id === 'E' && currentAnswered?.startsWith('E'));
              
              return (
                <div key={option.id} className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOptionSelect(questions[currentQ].id, option.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                      isSelected
                        ? SELECTED_COLORS[i]
                        : `border-base-300 text-base-content/80 ${OPTION_COLORS[i]}`
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full border-2 shrink-0 flex items-center justify-center font-medium text-xs ${
                        isSelected
                          ? 'border-current bg-current text-white'
                          : 'border-base-300 text-base-content/60'
                      }`}>
                        {option.id}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>

                  {/* Show text input ONLY if Option E is selected */}
                  {option.id === 'E' && isSelected && (
                    <div className="pl-14 pr-4 pb-2 animate-in slide-in-from-top-2">
                      <input
                        type="text"
                        placeholder="Type your custom answer here..."
                        value={(currentAnswered || '').replace('E: ', '')}
                        onChange={(e) => handleCustomTextChange(questions[currentQ].id, e.target.value)}
                        className="w-full px-4 py-2 border border-primary/40 rounded-lg focus:outline-none focus:border-primary bg-base-100 shadow-sm text-sm"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-2 px-5 py-3 border border-base-300 text-base-content/70 rounded-xl hover:bg-base-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {!isLastQuestion ? (
          <button
            onClick={() => setCurrentQ(prev => prev + 1)}
            disabled={!currentAnswered || currentAnswered === 'E: '}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < 20 || currentAnswered === 'E: ' || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-linear-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your profile...</>
              : <><Sparkles className="w-4 h-4" /> Get My Results</>
            }
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-xl text-sm text-error">
          ⚠️ {error}
        </div>
      )}

      <p className="text-center text-xs text-base-content/50">
        {answeredCount} of {questions.length} answered
        {answeredCount < 20 && ` · Answer all 20 to submit`}
      </p>
    </div>
  );
}