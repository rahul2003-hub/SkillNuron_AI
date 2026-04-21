import { Brain, Briefcase, Users, TrendingUp, Target, Sparkles } from 'lucide-react';
import { UserType } from '../App';

interface LandingPageProps {
  onUserTypeSelect: (type: UserType, name: string) => void;
}

export function LandingPage({ onUserTypeSelect }: LandingPageProps) {
  const handleGetStarted = (type: UserType) => {
    onUserTypeSelect(type, '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-600" />
              <span className="text-2xl text-purple-900">SkillNuron AI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-700 hover:text-purple-600 transition-colors">How It Works</a>
              <a href="#get-started" className="text-gray-700 hover:text-purple-600 transition-colors">Get Started</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">AI-Powered Career Intelligence</span>
          </div>
          <h1 className="text-6xl text-gray-900 mb-6">
            Bridge Your Skill Gap,
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600"> Accelerate Your Career</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            SkillNuron AI uses machine learning to analyze your skills, identify gaps, and connect you with the perfect opportunities or candidates.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('jobseeker')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg hover:shadow-lg transition-all"
            >
              I'm Looking for Jobs
            </button>
            <button
              onClick={() => handleGetStarted('recruiter')}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg border-2 border-purple-600 hover:bg-purple-50 transition-all"
            >
              I'm Hiring Talent
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20">
        <h2 className="text-4xl text-center text-gray-900 mb-16">Powerful Features for Everyone</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl text-gray-900 mb-3">Skill Gap Analysis</h3>
            <p className="text-gray-600">
              AI-powered analysis identifies missing skills and provides personalized learning recommendations.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl text-gray-900 mb-3">Career Path Mapping</h3>
            <p className="text-gray-600">
              Visualize your career progression with AI-generated roadmaps tailored to your goals.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="text-xl text-gray-900 mb-3">Smart Job Matching</h3>
            <p className="text-gray-600">
              Machine learning algorithms match candidates with jobs based on skills, experience, and potential.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl text-center text-gray-900 mb-16">How SkillNuron AI Works</h2>
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Users className="w-8 h-8 text-purple-600" />
                <h3 className="text-2xl text-gray-900">For Job Seekers</h3>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Create Your Profile</h4>
                    <p className="text-gray-600 text-sm">Add your current skills and career goals</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Get AI Analysis</h4>
                    <p className="text-gray-600 text-sm">Receive personalized skill gap insights and recommendations</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Discover Opportunities</h4>
                    <p className="text-gray-600 text-sm">Browse AI-matched job recommendations</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0">4</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Connect with Recruiters</h4>
                    <p className="text-gray-600 text-sm">Apply to positions that match your profile</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Briefcase className="w-8 h-8 text-pink-600" />
                <h3 className="text-2xl text-gray-900">For Recruiters</h3>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Post Job Requirements</h4>
                    <p className="text-gray-600 text-sm">Specify the skills and experience you need</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">AI Candidate Matching</h4>
                    <p className="text-gray-600 text-sm">Our ML algorithm finds the best-fit candidates</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Review Applications</h4>
                    <p className="text-gray-600 text-sm">See match scores and candidate profiles</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center flex-shrink-0">4</div>
                  <div>
                    <h4 className="text-gray-900 mb-1">Connect with Talent</h4>
                    <p className="text-gray-600 text-sm">Reach out to qualified candidates directly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="container mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-4xl mb-6">Ready to Transform Your Career Journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of professionals using AI to achieve their career goals</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('jobseeker')}
              className="bg-white text-purple-600 px-8 py-4 rounded-lg hover:shadow-lg transition-all"
            >
              Start as Job Seeker
            </button>
            <button
              onClick={() => handleGetStarted('recruiter')}
              className="bg-purple-700 text-white px-8 py-4 rounded-lg hover:bg-purple-800 transition-all"
            >
              Start as Recruiter
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2025 SkillNuron AI. Powered by Machine Learning.</p>
        </div>
      </footer>
    </div>
  );
}