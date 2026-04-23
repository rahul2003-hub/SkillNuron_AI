import { useState, useEffect } from 'react';
import { JobPosting } from '../App';
import { MapPin, FileText, CheckCircle2, AlertCircle, BrainCircuit, Users } from 'lucide-react';

interface CandidateMatchesProps {
  jobs: JobPosting[];
}

export function CandidateMatches({ jobs }: CandidateMatchesProps) {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs.length > 0 ? jobs[0].id : '');
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedJobId) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/recruiter/job/${selectedJobId}/matches`);
        if (response.ok) {
          const data = await response.json();
          setMatches(data.matches || []);
        }
      } catch (error) {
        console.error("Failed to fetch matches", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [selectedJobId]);

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900">No jobs posted yet</h3>
        <p className="text-gray-500 mt-2">Post a job to start seeing AI candidate matches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Candidate Matching</h2>
          <p className="text-gray-500 text-sm mt-1">Select a job to view Llama-3.3 ranked candidates.</p>
        </div>
        <select 
          value={selectedJobId} 
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none min-w-[250px] font-medium bg-white"
        >
          {jobs.map(job => (
            <option key={job.id} value={job.id}>{job.title}</option>
          ))}
        </select>
      </div>

      {/* Match Results */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <BrainCircuit className="w-12 h-12 text-purple-600 animate-pulse mb-4" />
          <p className="text-gray-600 font-medium">AI is analyzing candidate profiles...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No matches found</h3>
          <p className="text-gray-500">We couldn't find candidates matching these specific requirements yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((candidate, index) => (
            <div key={candidate.candidate_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Column: Candidate Info */}
                <div className="md:w-1/3 md:border-r border-gray-100 pr-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg">
                      #{index + 1}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {candidate.name || candidate.email.split('@')[0]}
                      </h3>
                      <p className="text-gray-500 text-sm truncate">{candidate.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0"/> 
                      <span className="truncate">{candidate.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0"/> 
                      ATS Score: <span className="font-semibold text-gray-900">{candidate.resume_score || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: AI Evaluation */}
                <div className="md:w-2/3">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-purple-600" /> AI Fit Evaluation
                    </h4>
                    <div className={`px-4 py-1 rounded-full text-sm font-bold ${candidate.match_score >= 80 ? 'bg-green-100 text-green-700' : candidate.match_score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {candidate.match_score}% Match
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg text-purple-900 text-sm italic border-l-4 border-purple-500 mb-4">
                    "{candidate.ai_evaluation?.reason || 'Strong candidate profile based on technical skill mapping.'}"
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Verified Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills?.slice(0, 8).map((skill: string) => (
                        <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> {skill}
                        </span>
                      ))}
                      {candidate.skills?.length > 8 && <span className="text-xs text-gray-500 py-1 font-medium">+{candidate.skills.length - 8} more</span>}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}