import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity, GitBranch } from 'lucide-react';
import { getJobApplicationTimeseries } from '../services/api';
import type { JobPosting } from '../App';

interface RecruiterAnalyticsChartsProps {
    jobs: JobPosting[];
    skillDemand: { skill: string; count: number }[];
    matchScoreDistribution: { range: string; count: number }[];
    applicationFunnel: { stage: string; count: number }[];
}

const DONUT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export function RecruiterAnalyticsCharts({ jobs, skillDemand, matchScoreDistribution, applicationFunnel }: RecruiterAnalyticsChartsProps) {
    const [selectedJobId, setSelectedJobId] = useState<string>('');
    const [series, setSeries] = useState<{ date: string; count: number }[]>([]);
    const [isLoadingSeries, setIsLoadingSeries] = useState(false);

    const loadSeries = (jobId: string) => {
        setSelectedJobId(jobId);
        setIsLoadingSeries(true);
        getJobApplicationTimeseries(jobId)
            .then(data => setSeries(data.series || []))
            .catch(err => console.error('Failed to load timeseries:', err))
            .finally(() => setIsLoadingSeries(false));
    };

    useEffect(() => {
        let active = true;
        if (!jobs.length) return;
        setIsLoadingSeries(true);
        Promise.all(jobs.map(async job => ({ job, data: await getJobApplicationTimeseries(job.id) })))
            .then(results => {
                if (!active) return;
                const preferred = results.find(result => result.data.series?.length) || results[0];
                setSelectedJobId(preferred.job.id);
                setSeries(preferred.data.series || []);
            })
            .catch(err => console.error('Failed to load application trends:', err))
            .finally(() => active && setIsLoadingSeries(false));
        return () => { active = false; };
    }, [jobs]);

    return (
        <div className="space-y-3">
            <div className="grid lg:grid-cols-3 gap-3">
                {/* Most Skills Available Bar Chart */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
                    <h3 className="text-sm font-semibold text-base-content flex items-center gap-2 mb-1">
                        <BarChart3 className="w-4 h-4 text-primary" /> Most Requested Skills
                    </h3>
                    <p className="text-[11px] text-base-content/50 mb-1">Demand across your open roles</p>
                    {skillDemand.length === 0 ? (
                        <p className="text-sm text-base-content/50 py-16 text-center">No skill data yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={175}>
                            <BarChart data={skillDemand.slice(0, 6)} layout="vertical" margin={{ left: -15, right: 8, top: 2, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-base-300)" />
                                <XAxis type="number" allowDecimals={false} stroke="var(--color-base-content)" fontSize={10} />
                                <YAxis type="category" dataKey="skill" width={78} stroke="var(--color-base-content)" fontSize={10} />
                                <Tooltip contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: 8 }} />
                                <Bar dataKey="count" name="Job postings" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Match Score Distribution Donut */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
                    <h3 className="text-sm font-semibold text-base-content flex items-center gap-2 mb-1">
                        <PieIcon className="w-4 h-4 text-primary" /> Resume Quality
                    </h3>
                    {matchScoreDistribution.every(b => b.count === 0) ? (
                        <p className="text-sm text-base-content/50 py-16 text-center">No resume scores yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={175}>
                            <PieChart>
                                <Pie data={matchScoreDistribution} dataKey="count" nameKey="range" cx="50%" cy="46%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                                    {matchScoreDistribution.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: 8 }} />
                                <Legend wrapperStyle={{ fontSize: 10, bottom: -2 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
                    <h3 className="text-sm font-semibold text-base-content flex items-center gap-2 mb-2"><GitBranch className="w-4 h-4 text-primary" /> Hiring Pipeline</h3>
                    <div className="space-y-2 pt-1">
                        {applicationFunnel.map((item, index) => {
                            const maximum = Math.max(...applicationFunnel.map(value => value.count), 1);
                            const color = item.stage === 'rejected' ? 'bg-error' : item.stage === 'hired' ? 'bg-success' : 'bg-primary';
                            return <div key={item.stage} className="grid grid-cols-[62px_1fr_24px] items-center gap-2 text-[10px]"><span className="capitalize text-base-content/70">{item.stage}</span><div className="h-2 rounded-full bg-base-200 overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max((item.count / maximum) * 100, item.count ? 8 : 0)}%`, opacity: 1 - index * 0.05 }} /></div><span className="font-bold text-right">{item.count}</span></div>;
                        })}
                    </div>
                </div>
            </div>

            {/* Applications Over Time */}
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-base-content flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Applications Over Time
                    </h3>
                    {jobs.length > 0 && (
                        <select
                            value={selectedJobId}
                            onChange={(e) => loadSeries(e.target.value)}
                            className="select select-bordered select-xs min-w-48"
                        >
                            {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                        </select>
                    )}
                </div>

                {jobs.length === 0 ? (
                    <p className="text-sm text-base-content/50 py-12 text-center">Post a job to see application trends.</p>
                ) : isLoadingSeries ? (
                    <div className="flex justify-center py-12"><span className="loading loading-spinner text-primary"></span></div>
                ) : series.length === 0 ? (
                    <p className="text-sm text-base-content/50 py-12 text-center">No applications for this job yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={series} margin={{ left: -18, right: 8, top: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" />
                            <XAxis dataKey="date" stroke="var(--color-base-content)" fontSize={10} />
                            <YAxis allowDecimals={false} stroke="var(--color-base-content)" fontSize={10} />
                            <Tooltip contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
