import React from 'react';
import { Brain, Briefcase, Users, TrendingUp, Target, Sparkles, Sun, Moon } from 'lucide-react';
import { UserType, isDarkTheme, setTheme } from '../App';

interface LandingPageProps {
  onUserTypeSelect: (type: UserType, name: string) => void;
}

export function LandingPage({ onUserTypeSelect }: LandingPageProps) {
  const handleGetStarted = (type: UserType) => {
    onUserTypeSelect(type, '');
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

return (
    <div id="home" className="min-h-screen bg-base-200">
      
      {/* Header */}
      <header className="border-b border-base-300 bg-base-100/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-primary" />
              <span className="text-2xl text-primary">SkillNuron AI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a 
                href="#home" 
                onClick={(e) => scrollToSection(e, 'home')} 
                className="text-base-content/70 hover:text-primary transition-colors cursor-pointer"
              >
                Home
              </a>
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, 'features')} 
                className="text-base-content/70 hover:text-primary transition-colors cursor-pointer"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => scrollToSection(e, 'how-it-works')} 
                className="text-base-content/70 hover:text-primary transition-colors cursor-pointer"
              >
                How It Works
              </a>
              <a 
                href="#get-started" 
                onClick={(e) => scrollToSection(e, 'get-started')} 
                className="text-base-content/70 hover:text-primary transition-colors cursor-pointer"
              >
                Get Started
              </a>
            </nav>

            {/* Theme Controller Button */}
            <label className="swap btn btn-ghost btn-circle" title="Toggle dark mode">
              <input type="checkbox" className="theme-controller" value="dark" defaultChecked={isDarkTheme()} onChange={(e) => setTheme(e.currentTarget.checked)} aria-label="Toggle dark mode" />
              <Sun className="swap-off w-5 h-5" aria-hidden="true" />
              <Moon className="swap-on w-5 h-5" aria-hidden="true" />
            </label>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">AI-Powered Career Intelligence</span>
          </div>
          <h1 className="text-6xl text-base-content mb-6">
            Bridge Your Skill Gap,
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-secondary"> Accelerate Your Career</span>
          </h1>
          <p className="text-xl text-base-content/60 mb-12">
            SkillNuron AI uses machine learning to analyze your skills, identify gaps, and connect you with the perfect opportunities or candidates.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('jobseeker')}
              className="bg-linear-to-r from-primary to-secondary text-primary-content px-8 py-4 rounded-lg hover:shadow-lg transition-all"
            >
              I'm Looking for Jobs
            </button>
            <button
              onClick={() => handleGetStarted('recruiter')}
              className="bg-base-100 text-primary px-8 py-4 rounded-lg border-2 border-primary hover:bg-primary/10 transition-all"
            >
              I'm Hiring Talent
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20 scroll-mt-24">
        <h2 className="text-4xl text-center text-base-content mb-16">Powerful Features for Everyone</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-base-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl text-base-content mb-3">Skill Gap Analysis</h3>
            <p className="text-base-content/60">
              AI-powered analysis identifies missing skills and provides personalized learning recommendations.
            </p>
          </div>
          <div className="bg-base-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-info" />
            </div>
            <h3 className="text-xl text-base-content mb-3">Career Path Mapping</h3>
            <p className="text-base-content/60">
              Visualize your career progression with AI-generated roadmaps tailored to your goals.
            </p>
          </div>
          <div className="bg-base-100 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl text-base-content mb-3">Smart Job Matching</h3>
            <p className="text-base-content/60">
              Machine learning algorithms match candidates with jobs based on skills, experience, and potential.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-base-100 py-20 scroll-mt-24">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl text-center text-base-content mb-16">How SkillNuron AI Works</h2>
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Users className="w-8 h-8 text-primary" />
                <h3 className="text-2xl text-base-content">For Job Seekers</h3>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="text-base-content mb-1">Create Your Profile</h4>
                    <p className="text-base-content/60 text-sm">Add your current skills and career goals</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="text-base-content mb-1">Get AI Analysis</h4>
                    <p className="text-base-content/60 text-sm">Receive personalized skill gap insights and recommendations</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="text-base-content mb-1">Discover Opportunities</h4>
                    <p className="text-base-content/60 text-sm">Browse AI-matched job recommendations</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h4 className="text-base-content mb-1">Connect with Recruiters</h4>
                    <p className="text-base-content/60 text-sm">Apply to positions that match your profile</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Briefcase className="w-8 h-8 text-secondary" />
                <h3 className="text-2xl text-base-content">For Recruiters</h3>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="text-base-content mb-1">Post Job Requirements</h4>
                    <p className="text-base-content/60 text-sm">Specify the skills and experience you need</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="text-base-content mb-1">AI Candidate Matching</h4>
                    <p className="text-base-content/60 text-sm">Our ML algorithm finds the best-fit candidates</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="text-base-content mb-1">Review Applications</h4>
                    <p className="text-base-content/60 text-sm">See match scores and candidate profiles</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-secondary/10 text-secondary rounded-full flex items-center justify-center shrink-0">4</div>
                  <div>
                    <h4 className="text-base-content mb-1">Connect with Talent</h4>
                    <p className="text-base-content/60 text-sm">Reach out to qualified candidates directly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="container mx-auto px-6 py-20 scroll-mt-24">
        <div className="bg-linear-to-r from-primary to-secondary rounded-3xl p-12 text-center text-primary-content">
          <h2 className="text-4xl mb-6">Ready to Transform Your Career Journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of professionals using AI to achieve their career goals</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleGetStarted('jobseeker')}
              className="bg-base-100 text-primary px-8 py-4 rounded-lg hover:shadow-lg transition-all"
            >
              Start as Job Seeker
            </button>
            <button
              onClick={() => handleGetStarted('recruiter')}
              className="bg-primary/80 text-primary-content px-8 py-4 rounded-lg hover:bg-primary transition-all"
            >
              Start as Recruiter
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-base-300 bg-base-100 py-8">
        <div className="container mx-auto px-6 text-center text-base-content/60">
          <p>&copy; 2026 SkillNuron AI. Powered by Machine Learning.</p>
        </div>
      </footer>
    </div>
  );
}
