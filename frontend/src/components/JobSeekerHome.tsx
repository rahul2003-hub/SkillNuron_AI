import { useState, useEffect } from 'react';
import { Award, FileText, Briefcase, Target, ArrowRight, Building2, MapPin, Sparkles, ChevronRight } from 'lucide-react';
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
    const [topRecruiters, setTopRecruiters] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) { setIsLoading(false); return; }

        const load = async () => {
            setIsLoading(true);
            try {
                // Single backend call — computed server-side in Python (routes/profile.py)
                const data = await getDashboard();
                setSkillsCount(data.skills_count || 0);
                setLatestResumeScore(data.latest_resume_score ?? null);
                setApplicationsCount(data.applications_count || 0);
                setCompleteness(data.profile_completeness || 0);
                setTopRecruiters(data.top_recruiters || []);
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
                        className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 flex flex-col items-start text-left hover:shadow-md hover:border-primary/40 transition-all"
                    >
                        <div className={`p-3 rounded-lg ${bg} ${color} mb-3`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <p className="text-2xl font-bold text-base-content">{value}</p>
                        <p className="text-sm text-base-content/60 font-medium">{label}</p>
                    </button>
                ))}
            </div>

            {/* Top 5 Recruiters Hiring For You */}
            {topRecruiters.length > 0 && (
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" /> Top 5 Recruiters Hiring For You
                            </h3>
                            <p className="text-xs text-base-content/60 mt-0.5">
                                Matched with your skills, target roles, and preferences
                            </p>
                        </div>
                        <button
                            onClick={() => setActiveTab('job-recommendations')}
                            className="btn btn-ghost btn-sm text-primary gap-1 font-medium self-start sm:self-auto"
                        >
                            Browse All Jobs <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topRecruiters.map((recruiter, idx) => (
                            <div
                                key={recruiter.company + idx}
                                className="card bg-base-200/50 hover:bg-base-200/90 border border-base-300 hover:border-primary/40 transition-all p-4 rounded-xl flex flex-col justify-between gap-3 shadow-xs"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20 shrink-0">
                                                {recruiter.company.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-base-content text-sm truncate">
                                                    {recruiter.company}
                                                </h4>
                                                <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5">
                                                    {recruiter.locations?.[0] ? (
                                                        <>
                                                            <MapPin className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{recruiter.locations[0]}</span>
                                                        </>
                                                    ) : (
                                                        <span>Active Hiring</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="badge badge-success badge-sm font-semibold gap-1 shrink-0">
                                            <Sparkles className="w-3 h-3" /> {recruiter.match_score}%
                                        </span>
                                    </div>

                                    {recruiter.top_roles?.length > 0 && (
                                        <p className="text-xs text-base-content/70 line-clamp-1 mb-2">
                                            <span className="font-medium text-base-content/90">Hiring: </span>
                                            {recruiter.top_roles.join(', ')}
                                        </p>
                                    )}

                                    {recruiter.matching_skills?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {recruiter.matching_skills.slice(0, 3).map((skill: string) => (
                                                <span key={skill} className="badge badge-neutral badge-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-base-300 text-xs">
                                    <span className="text-base-content/60 font-medium">
                                        {recruiter.active_jobs_count} open {recruiter.active_jobs_count === 1 ? 'role' : 'roles'}
                                    </span>
                                    <button
                                        onClick={() => setActiveTab('job-recommendations')}
                                        className="btn btn-primary btn-xs gap-1"
                                    >
                                        View Jobs <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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