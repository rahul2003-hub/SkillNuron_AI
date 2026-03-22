import { useState, useEffect } from 'react';
import { Brain, ChevronRight, ChevronLeft, CheckCircle, Loader2, Sparkles, RotateCcw, Star, Target, Zap, ArrowRight } from 'lucide-react';

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

  const handleAnswer = (optionId: string) => {
    const qId = questions[currentQ].id;
    setAnswers(prev => ({ ...prev, [qId]: optionId }));
    // Auto advance after short delay
    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
      }
    }, 400);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/api/psychometric/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed');
      setResult(data.profile);
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
    'hover:border-purple-400 hover:bg-purple-50',
    'hover:border-blue-400 hover:bg-blue-50',
    'hover:border-teal-400 hover:bg-teal-50',
    'hover:border-amber-400 hover:bg-amber-50',
    'hover:border-pink-400 hover:bg-pink-50',
  ];

  const SELECTED_COLORS = [
    'border-purple-500 bg-purple-50 text-purple-800',
    'border-blue-500 bg-blue-50 text-blue-800',
    'border-teal-500 bg-teal-50 text-teal-800',
    'border-amber-500 bg-amber-50 text-amber-800',
    'border-pink-500 bg-pink-50 text-pink-800',
  ];

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Welcome Screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-8 shadow-lg text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8" />
          </div>
          <h2 className="text-3xl mb-3">Tech Career Assessment</h2>
          <p className="opacity-90 text-lg">Discover which tech career role matches your personality and interests.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-900 text-lg mb-4">What you will discover</h3>
          <div className="space-y-3">
            {[
              { icon: '🧠', text: 'Your tech personality type and core strengths' },
              { icon: '🎯', text: 'Top 3 career roles ranked by fit score' },
              { icon: '🏢', text: 'Indian companies where you would thrive' },
              { icon: '🚀', text: 'Your first concrete step to start this week' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <p className="text-gray-700 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            <strong>15 questions · Takes 3–5 minutes · Tech focused</strong><br />
            Covers: Backend · Frontend · Data · AI/ML · DevOps · Product roles
          </p>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all text-lg flex items-center justify-center gap-2"
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
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">{result.summary}</p>
          </div>
        </div>

        {/* Strengths + Work Style */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h3 className="text-gray-900">Top Strengths</h3>
            </div>
            <div className="space-y-2">
              {result.top_strengths?.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="text-gray-900">Work Style</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">{result.work_style}</p>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900">Ideal environment</span>
            </div>
            <p className="text-sm text-gray-600">{result.ideal_environment}</p>
          </div>
        </div>

        {/* Career Matches */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-900 text-lg mb-6">Your Top Career Matches</h3>
          <div className="space-y-4">
            {result.career_matches?.map((match, i) => (
              <div key={i} className={`border-2 rounded-xl p-5 ${i === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-gray-900 font-medium text-lg">{match.role}</span>
                      {i === 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          ⭐ Best fit
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{match.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className={`text-3xl font-medium ${i === 0 ? 'text-purple-600' : 'text-gray-700'}`}>
                      {match.fit_score}%
                    </div>
                    <div className="text-xs text-gray-400">fit score</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${i === 0 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-400'}`}
                    style={{ width: `${match.fit_score}%` }}
                  />
                </div>
                {match.indian_companies?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">🏢 Top hiring companies in India</p>
                    <div className="flex flex-wrap gap-2">
                      {match.indian_companies.map((c, j) => (
                        <span key={j} className="px-2 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs">
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
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <ArrowRight className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-green-900 font-medium mb-1">Your recommended first step this week</h4>
                <p className="text-sm text-green-800">{result.recommended_first_step}</p>
              </div>
            </div>
          </div>
        )}

        {/* Learning Style */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-900 mb-2">How You Learn Best</h3>
          <p className="text-sm text-gray-700">{result.learning_style}</p>
        </div>

        {/* Roles to avoid */}
        {result.career_avoid?.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Roles that may not suit your style</h3>
            <div className="space-y-1">
              {result.career_avoid.map((role, i) => (
                <p key={i} className="text-xs text-red-700">• {role}</p>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleReset}
          className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
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
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Question {currentQ + 1} of {questions.length}</span>
          <span className="text-sm text-purple-600 font-medium">{progress}% complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
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
                  ? 'bg-purple-600 text-white'
                  : answers[q.id]
                  ? 'bg-green-400 text-white'
                  : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Card */}
      {questions[currentQ] && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-700 font-medium text-sm">{currentQ + 1}</span>
            </div>
            <h3 className="text-gray-900 text-lg leading-snug pt-1">
              {questions[currentQ].question}
            </h3>
          </div>

          <div className="space-y-3">
            {questions[currentQ].options.map((option, i) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                  currentAnswered === option.id
                    ? SELECTED_COLORS[i]
                    : `border-gray-200 text-gray-700 ${OPTION_COLORS[i]}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center font-medium text-xs ${
                    currentAnswered === option.id
                      ? 'border-current bg-current text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {option.id}
                  </div>
                  <span>{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
          disabled={currentQ === 0}
          className="flex items-center gap-2 px-5 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {!isLastQuestion ? (
          <button
            onClick={() => setCurrentQ(prev => prev + 1)}
            disabled={!currentAnswered}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < 10 || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your profile...</>
              : <><Sparkles className="w-4 h-4" /> Get My Results</>
            }
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        {answeredCount} of {questions.length} answered
        {answeredCount < 10 && ` · Answer at least 10 to submit`}
      </p>
    </div>
  );
}