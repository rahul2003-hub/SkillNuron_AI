import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';
import { getJobApplicationTimeseries } from '../services/api';
import type { JobPosting } from '../App';

interface RecruiterAnalyticsChartsProps {
    jobs: JobPosting[];
    skillDemand: { skill: string; count: number }[];
    matchScoreDistribution: { range: string; count: number }[];
}

const DONUT_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

export function RecruiterAnalyticsCharts({ jobs, skillDemand, matchScoreDistribution }: RecruiterAnalyticsChartsProps) {
    const [selectedJobId, setSelectedJobId] = useState<string>(jobs.length > 0 ? jobs[0].id : '');
    const [series, setSeries] = useState<{ date: string; count: number }[]>([]);
    const [isLoadingSeries, setIsLoadingSeries] = useState(false);

    useEffect(() => {
        if (!selectedJobId) return;
        setIsLoadingSeries(true);
        getJobApplicationTimeseries(selectedJobId)
            .then(data => setSeries(data.series || []))
            .catch(err => console.error('Failed to load timeseries:', err))
            .finally(() => setIsLoadingSeries(false));
    }, [selectedJobId]);

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Most Skills Available Bar Chart */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-primary" /> Most Skills Available
                    </h3>
                    {skillDemand.length === 0 ? (
                        <p className="text-sm text-base-content/50 py-10 text-center">No skill data yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={skillDemand} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-base-300)" />
                                <XAxis type="number" allowDecimals={false} stroke="var(--color-base-content)" fontSize={12} />
                                <YAxis type="category" dataKey="skill" width={90} stroke="var(--color-base-content)" fontSize={12} />
                                <Tooltip contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: 8 }} />
                                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Match Score Distribution Donut */}
                <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2 mb-4">
                        <PieIcon className="w-5 h-5 text-primary" /> Match Score Distribution
                    </h3>
                    {matchScoreDistribution.every(b => b.count === 0) ? (
                        <p className="text-sm text-base-content/50 py-10 text-center">No resume scores yet.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={matchScoreDistribution} dataKey="count" nameKey="range" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                                    {matchScoreDistribution.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: 8 }} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Applications Over Time */}
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" /> Applications Over Time
                    </h3>
                    {jobs.length > 0 && (
                        <select
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                            className="select select-bordered select-sm min-w-48"
                        >
                            {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
                        </select>
                    )}
                </div>

                {jobs.length === 0 ? (
                    <p className="text-sm text-base-content/50 py-10 text-center">Post a job to see application trends.</p>
                ) : isLoadingSeries ? (
                    <div className="flex justify-center py-10"><span className="loading loading-spinner text-primary"></span></div>
                ) : series.length === 0 ? (
                    <p className="text-sm text-base-content/50 py-10 text-center">No applications for this job yet.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" />
                            <XAxis dataKey="date" stroke="var(--color-base-content)" fontSize={12} />
                            <YAxis allowDecimals={false} stroke="var(--color-base-content)" fontSize={12} />
                            <Tooltip contentStyle={{ background: 'var(--color-base-100)', border: '1px solid var(--color-base-300)', borderRadius: 8 }} />
                            <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}