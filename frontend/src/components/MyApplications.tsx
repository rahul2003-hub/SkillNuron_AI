import { useState, useEffect } from 'react';
import { Briefcase, Building, ClipboardList } from 'lucide-react';
import { getMyApplications } from '../services/api';

interface ApplicationItem {
    application_id: string;
    job_id: string;
    job_title: string;
    company: string;
    status: string;
    applied_at: string;
}

const STATUS_STYLES: Record<string, string> = {
    applied: 'badge-info',
    shortlisted: 'badge-warning',
    hired: 'badge-success',
    rejected: 'badge-error',
};

export function MyApplications() {
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getMyApplications()
            .then(data => setApplications(data.applications || []))
            .catch(err => console.error('Failed to load applications:', err))
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (applications.length === 0) {
        return (
            <div className="text-center py-20 bg-base-100 rounded-xl shadow-sm border border-base-300">
                <ClipboardList className="w-12 h-12 text-base-content/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-base-content">No applications yet</h3>
                <p className="text-base-content/60 mt-2">Apply to SkillNuron jobs from the Jobs tab to track them here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
                <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" /> My Applications
                </h2>
                <p className="text-sm text-base-content/60 mt-1">Track the status of jobs you've applied to on SkillNuron.</p>
            </div>

            <div className="overflow-x-auto bg-base-100 rounded-xl shadow-sm border border-base-300">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Job</th>
                            <th>Company</th>
                            <th>Applied On</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app.application_id}>
                                <td className="font-medium text-base-content flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-base-content/40" /> {app.job_title}
                                </td>
                                <td className="text-base-content/70">
                                    <span className="flex items-center gap-1.5">
                                        <Building className="w-3.5 h-3.5 text-base-content/40" /> {app.company}
                                    </span>
                                </td>
                                <td className="text-base-content/60 text-sm">
                                    {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                                </td>
                                <td>
                                    <span className={`badge ${STATUS_STYLES[app.status] || 'badge-neutral'} capitalize`}>
                                        {app.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}