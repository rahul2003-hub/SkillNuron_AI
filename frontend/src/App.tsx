import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RecruiterDashboard } from './components/RecruiterDashboard';
import { JobSeekerLayout } from './components/JobSeekerLayout';
import { supabase } from './services/supabase';

export const isDarkTheme = () => localStorage.getItem('theme') === 'dark';

export const setTheme = (isDark: boolean) => {
  const theme = isDark ? 'dark' : 'corporate';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
};

export type UserType = 'jobseeker' | 'recruiter' | null;

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Skill {
  name: string;
  level: SkillLevel;
  category: string;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  requiredSkills: string[];
  description: string;
  postedBy: string;
  postedDate: string;
  matchScore?: number;
}

export interface CareerPath {
  role: string;
  level: string;
  timeline: string;
  requiredSkills: string[];
  averageSalary: string;
}

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [userType, setUserType] = useState<UserType>(null);
  const [initialLoginType, setInitialLoginType] = useState<UserType>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const role = (metadata.user_type as UserType) || 'jobseeker';
        const name = metadata.name || session.user.email?.split('@')[0] || 'User';

        setUserType(role);
        setUserName(name);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        setCurrentView('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const role = (metadata.user_type as UserType) || 'jobseeker';
        const name = metadata.name || session.user.email?.split('@')[0] || 'User';

        setUserType(role);
        setUserName(name);
        setUserEmail(session.user.email || '');
        setUserId(session.user.id);
        setCurrentView('dashboard');
      } else {
        setUserType(null);
        setUserName('');
        setUserEmail('');
        setUserId('');
        setCurrentView('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserTypeSelect = (type: UserType) => {
    setInitialLoginType(type);
    setCurrentView('login');
  };

  const handleLogin = (type: UserType, name: string, email: string, id: string) => {
    setUserType(type);
    setUserName(name);
    setUserEmail(email);
    setUserId(id);
    setCurrentView('dashboard');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView('landing');
    setUserType(null);
    setUserName('');
    setUserEmail('');
    setUserId('');
  };

  const handleBackToLanding = () => {
    setInitialLoginType(null);
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return <LandingPage onUserTypeSelect={handleUserTypeSelect} />;
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onBackToLanding={handleBackToLanding}
        initialUserType={initialLoginType}
      />
    );
  }

  if (userType === 'jobseeker') {
    return (
      <JobSeekerLayout
        userName={userName}
        userId={userId}
        userEmail={userEmail}
        onLogout={handleLogout}
      />
    );
  }

  if (userType === 'recruiter') {
    return (
      <div className="min-h-screen bg-base-200">
        <RecruiterDashboard
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  return null;
}

export default App;
