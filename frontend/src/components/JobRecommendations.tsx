import { useState, useEffect } from 'react';
import { MapPin, Briefcase, TrendingUp, ExternalLink, Search, Loader2, RefreshCw } from 'lucide-react';
import { searchJobs } from '../services/api';

const INDIAN_CITIES = [
  "Mumbai", "Pune", "Bangalore", "Hyderabad", "Delhi",
  "Noida", "Chennai", "Navi Mumbai", "Kolkata", "Ahmedabad"
];

const TECH_ROLES = [
  "Python Developer", "Full Stack Developer", "Frontend Developer",
  "Backend Developer", "Data Scientist", "ML Engineer",
  "DevOps Engineer", "React Developer", "Java Developer",
  "Software Engineer", "Cloud Engineer", "QA Engineer"
];

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  posted_date: string;
  type: string;
  source: string;
}

export function JobRecommendations() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [keywords, setKeywords] = useState('Software Developer');
  const [location, setLocation] = useState('Mumbai');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setSelectedJob(null);
    setHasSearched(true);
    try {
      const data = await searchJobs(keywords, location, 10);
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError('Could not fetch jobs. Make sure your backend is running.');
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-linear-to-r from-primary to-secondary text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-base-100/20 rounded-lg flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-1">Live Indian Job Market</h2>
            <p className="opacity-90 text-sm">Real jobs from Indian companies — powered by Adzuna</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-base-100 rounded-xl shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-base-content/60 mb-1">Job Role</label>
            <select
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100 text-base-content"
            >
              {TECH_ROLES.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs text-base-content/60 mb-1">City</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100 text-base-content"
            >
              {INDIAN_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full md:w-auto px-6 py-2.5 bg-linear-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-4 h-4" /> Search Jobs</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 text-sm text-error">
          ⚠️ {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-base-100 rounded-xl p-5 shadow-sm animate-pulse">
              <div className="h-4 bg-base-300 rounded w-3/4 mb-3" />
              <div className="h-3 bg-base-200 rounded w-1/2 mb-4" />
              <div className="h-3 bg-base-200 rounded w-full mb-2" />
              <div className="h-3 bg-base-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && hasSearched && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-base-content/70">
            {jobs.length > 0
              ? `Found ${jobs.length} jobs for "${keywords}" in ${location}`
              : `No jobs found for "${keywords}" in ${location}`
            }
          </p>
          <button
            onClick={handleSearch}
            className="flex items-center gap-1 text-sm text-primary hover:text-primary"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      )}

      {/* Job Cards */}
      {!isLoading && jobs.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-base-100 rounded-xl p-5 shadow-sm border border-base-300 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base-content font-medium truncate">{job.title}</h3>
                  <p className="text-primary text-sm">{job.company}</p>
                </div>
                <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full shrink-0 ml-2">
                  Live
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-base-content/70">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span>{job.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-success font-medium">₹</span>
                  <span className="text-success">{job.salary}</span>
                </div>
              </div>

              <p className="text-xs text-base-content/60 line-clamp-2 mb-4">{job.description}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-base-content/50">Posted: {job.posted_date}</span>
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary font-medium"
                >
                  Apply <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="bg-base-100 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl text-base-content mb-1">{selectedJob.title}</h2>
                <p className="text-primary text-lg">{selectedJob.company}</p>
              </div>
              <span className="text-xs bg-success/20 text-success px-3 py-1 rounded-full">
                Live on Adzuna
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-base-content/50" />
                <div>
                  <p className="text-xs text-base-content/60">Location</p>
                  <p className="text-sm text-base-content">{selectedJob.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-base-content/50" />
                <div>
                  <p className="text-xs text-base-content/60">Type</p>
                  <p className="text-sm text-base-content">{selectedJob.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success font-medium">₹</span>
                <div>
                  <p className="text-xs text-base-content/60">Salary</p>
                  <p className="text-sm text-success font-medium">{selectedJob.salary}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-base-content/50" />
                <div>
                  <p className="text-xs text-base-content/60">Posted</p>
                  <p className="text-sm text-base-content">{selectedJob.posted_date}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base-content font-medium mb-2">Job Description</h3>
              <p className="text-sm text-base-content/70 leading-relaxed">{selectedJob.description}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedJob(null)}
                className="flex-1 py-3 border border-base-300 rounded-xl hover:bg-base-200 text-sm"
              >
                Close
              </button>
              <a
                href={selectedJob.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-linear-to-r from-primary to-secondary text-white rounded-xl hover:shadow-lg text-center text-sm flex items-center justify-center gap-2"
              >
                Apply on Adzuna <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}