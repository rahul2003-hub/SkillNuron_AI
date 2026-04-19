import { useState, useEffect} from 'react';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { JobSeekerDashboard } from './components/JobSeekerDashboard';
import { RecruiterDashboard } from './components/RecruiterDashboard';

export type UserType = 'jobseeker' | 'recruiter' | null;

export interface Skill {
  name: string;
  level: number;
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
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [initialLoginType, setInitialLoginType] = useState<UserType>(null);

  const handleUserTypeSelect = (type: UserType) => {
    setInitialLoginType(type);
    setCurrentView('login');
  };

  const handleLogin = (type: UserType, name: string, email: string, id: string) => {
    setUserType(type);
    setUserName(name);
    setUserEmail(email);
    setUserId(id);
    setCurrentView('dashboard'); // <-- Changed from setIsLoggedIn
    // Save session to browser
    localStorage.setItem('user_session', JSON.stringify({ type, name, email, id }));
  };

  const handleLogout = () => {
    setCurrentView('landing'); // <-- Changed from setIsLoggedIn
    setUserType(null);         // <-- Added to properly clear the user type
    setUserName('');
    setUserEmail('');
    setUserId('');
    // Clear session from browser
    localStorage.removeItem('user_session');
  };

  const handleBackToLanding = () => {
    setInitialLoginType(null);
    setCurrentView('landing');
  };

  useEffect(() => {
  const savedSession = localStorage.getItem('user_session');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    setUserType(session.type);
    setUserName(session.name);
    setUserEmail(session.email);
    setUserId(session.id);
    setCurrentView('dashboard'); // <-- Changed from setIsLoggedIn
  }
}, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {userType === 'jobseeker' ? (
        <JobSeekerDashboard
          userName={userName}
          userId={userId}
          userEmail={userEmail}
          onLogout={handleLogout}
        />
      ) : (
        <RecruiterDashboard
          userName={userName}
          userId={userId}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;