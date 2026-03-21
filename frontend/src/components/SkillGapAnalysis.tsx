import { Brain, TrendingUp, AlertCircle, BookOpen, CheckCircle } from 'lucide-react';

interface SkillGap {
  skill: string;
  currentLevel: number;
  targetLevel: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

const skillGaps: SkillGap[] = [
  {
    skill: 'TypeScript',
    currentLevel: 0,
    targetLevel: 80,
    priority: 'high',
    recommendation: 'Critical for modern frontend development. Start with TypeScript fundamentals course.',
  },
  {
    skill: 'Docker',
    currentLevel: 0,
    targetLevel: 70,
    priority: 'high',
    recommendation: 'Essential for DevOps and deployment. Learn containerization basics.',
  },
  {
    skill: 'Node.js',
    currentLevel: 0,
    targetLevel: 75,
    priority: 'high',
    recommendation: 'Key for backend development. Build REST APIs to gain experience.',
  },
  {
    skill: 'AWS',
    currentLevel: 0,
    targetLevel: 65,
    priority: 'medium',
    recommendation: 'Cloud skills are in high demand. Get AWS Certified Cloud Practitioner.',
  },
  {
    skill: 'MongoDB',
    currentLevel: 0,
    targetLevel: 70,
    priority: 'medium',
    recommendation: 'NoSQL database skills complement SQL knowledge.',
  },
];

const learningResources = [
  {
    title: 'TypeScript Deep Dive',
    platform: 'Free Online Book',
    duration: '20 hours',
    skill: 'TypeScript',
  },
  {
    title: 'Docker Mastery',
    platform: 'Udemy',
    duration: '16 hours',
    skill: 'Docker',
  },
  {
    title: 'Node.js - The Complete Guide',
    platform: 'Coursera',
    duration: '40 hours',
    skill: 'Node.js',
  },
  {
    title: 'AWS Certified Cloud Practitioner',
    platform: 'AWS Training',
    duration: '12 hours',
    skill: 'AWS',
  },
];

export function SkillGapAnalysis() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-2">AI-Powered Skill Gap Analysis</h2>
            <p className="opacity-90">
              Based on current market trends and top job requirements, we've identified key skills that will accelerate your career growth.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-gray-600">Critical Gaps</span>
          </div>
          <p className="text-3xl text-gray-900">{skillGaps.filter(g => g.priority === 'high').length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <span className="text-gray-600">Growth Areas</span>
          </div>
          <p className="text-3xl text-gray-900">{skillGaps.filter(g => g.priority === 'medium').length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-gray-600">Learning Hours</span>
          </div>
          <p className="text-3xl text-gray-900">88h</p>
        </div>
      </div>

      {/* Skill Gaps */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-2xl text-gray-900 mb-6">Identified Skill Gaps</h3>
        <div className="space-y-4">
          {skillGaps.map((gap, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg text-gray-900">{gap.skill}</h4>
                    <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(gap.priority)}`}>
                      {gap.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{gap.recommendation}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Current</span>
                    <span className="text-gray-600">Target: {gap.targetLevel}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-400"
                      style={{ width: `${gap.currentLevel}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Resources */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <h3 className="text-2xl text-gray-900">Recommended Learning Resources</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {learningResources.map((resource, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-gray-900">{resource.title}</h4>
                <CheckCircle className="w-5 h-5 text-gray-300" />
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

      {/* Action Plan */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-xl text-gray-900 mb-4">Your Learning Action Plan</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0">1</div>
            <p className="text-gray-700">Start with TypeScript - Critical for 80% of recommended jobs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0">2</div>
            <p className="text-gray-700">Learn Docker and containerization fundamentals</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0">3</div>
            <p className="text-gray-700">Build projects with Node.js to gain practical experience</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center flex-shrink-0">4</div>
            <p className="text-gray-700">Get AWS certified to stand out to employers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
