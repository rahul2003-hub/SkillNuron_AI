import { useState, useEffect } from 'react';
import { Award, FileText, Briefcase, Target, ArrowRight } from 'lucide-react';
import { getDashboard } from '../services/api';
 
interface JobSeekerHomeProps {
    userId: string;
    userName: string;
    setActiveTab: (tab: any) => void;
}
 
export function JobSeekerHome({ userId, userName, setActiveTab }: JobSeekerHomeProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [skillsCount, setSkillsCount] = useState(0);
    const [latestResumeScore, setLatestResumeScore] = useState<number | null>(null);
    const [applicationsCount, setApplicationsCount] = useState(0);
    const [completeness, setCompleteness] = useState(0);
 
    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }
 
        const load = async () => {
            setIsLoading(true);
            try {
                // Single backend call — skill count, resume score, application
                // count, and completeness % are all computed server-side in
                // GET /api/profile/dashboard (see routes/profile.py).
                const data = await getDashboard();
                setSkillsCount(data.skills_count || 0);
                setLatestResumeScore(data.latest_resume_score ?? null);
                setApplicationsCount(data.applications_count || 0);
                setCompleteness(data.profile_completeness || 0);
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setIsLoading(false);
            }
        };
 
        load();
    }, [userId]);
 
    const cards = [
        { label: 'Skills Added', value: skillsCount, icon: Award, color: 'text-primary', bg: 'bg-primary/10', tab: 'profile' },
        { label: 'Latest Resume Score', value: latestResumeScore !== null ? `${latestResumeScore}%` : '—', icon: FileText, color: 'text-info', bg: 'bg-info/10', tab: 'resume-analyzer' },
        { label: 'Applications Sent', value: applicationsCount, icon: Briefcase, color: 'text-success', bg: 'bg-success/10', tab: 'my-applications' },
    ];
 
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }
 
    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="bg-linear-to-r from-primary to-secondary text-primary-content rounded-xl p-6 shadow-lg">
                <h2 className="text-2xl font-bold">Welcome back, {userName} 👋</h2>
                <p className="opacity-90 text-sm mt-1">Here's a snapshot of your job-search progress.</p>
            </div>
 
            {/* Profile Completeness Gauge + Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex flex-col items-center justify-center text-center">
                    <div
                        className="radial-progress text-primary"
                        style={{ '--value': completeness, '--size': '6rem', '--thickness': '8px' } as React.CSSProperties}
                        aria-valuenow={completeness}
                        role="progressbar"
                    >
                        <span className="text-base-content font-bold">{completeness}%</span>
                    </div>
                    <p className="text-sm font-medium text-base-content/70 mt-3">Profile Completeness</p>
                    {completeness < 100 && (
                        <button onClick={() => setActiveTab('profile')} className="text-xs text-primary hover:underline mt-1 flex items-center gap-1">
                            Complete profile <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>
 
                {cards.map(({ label, value, icon: Icon, color, bg, tab }) => (
                    <button
                        key={label}
                        onClick={() => setActiveTab(tab)}
                        className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex flex-col items-start text-left hover:shadow-md hover:border-primary/40 "
                    >
                        <div className={`p-3 rounded-lg ${bg} ${color} mb-3`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <p className="text-2xl font-bold text-base-content">{value}</p>
                        <p className="text-sm text-base-content/60 font-medium">{label}</p>
                    </button>
                ))}
            </div>
 
            {/* Quick Actions */}
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
                <h3 className="text-lg font-semibold text-base-content mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Quick Actions
                </h3>
                <div className="grid sm:grid-cols-3 gap-3">
                    <button onClick={() => setActiveTab('gap-analysis')} className="btn btn-outline btn-primary justify-start">
                        Run Gap Analysis
                    </button>
                    <button onClick={() => setActiveTab('job-recommendations')} className="btn btn-outline btn-primary justify-start">
                        Browse Jobs
                    </button>
                    <button onClick={() => setActiveTab('resume-analyzer')} className="btn btn-outline btn-primary justify-start">
                        Analyze Resume
                    </button>
                </div>
            </div>
        </div>
    );
}