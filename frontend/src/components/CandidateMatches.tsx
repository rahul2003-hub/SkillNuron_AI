// @ts-nocheck
import { useState } from 'react';
import { Star, Mail, Phone, MapPin, Award, Briefcase } from 'lucide-react';
import type { JobPosting } from '../App';

interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  skills: string[];
  experience: string;
  matchScore: number;
  appliedTo: string;
}

interface CandidateMatchesProps {
  jobs: JobPosting[];
}

const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Alex Johnson',
    title: 'Full Stack Developer',
    location: 'San Francisco, CA',
    email: 'alex.johnson@email.com',
    phone: '+1 (555) 123-4567',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker'],
    experience: '5 years',
    matchScore: 95,
    appliedTo: '1',
  },
  {
    id: '2',
    name: 'Sarah Williams',
    title: 'Senior Frontend Developer',
    location: 'Remote',
    email: 'sarah.w@email.com',
    phone: '+1 (555) 234-5678',
    skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'Git'],
    experience: '6 years',
    matchScore: 88,
    appliedTo: '1',
  },
  {
    id: '3',
    name: 'Michael Chen',
    title: 'Backend Engineer',
    location: 'New York, NY',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 345-6789',
    skills: ['Node.js', 'Python', 'MongoDB', 'PostgreSQL', 'AWS'],
    experience: '4 years',
    matchScore: 82,
    appliedTo: '1',
  },
  {
    id: '4',
    name: 'Emily Rodriguez',
    title: 'Full Stack Engineer',
    location: 'Austin, TX',
    email: 'emily.r@email.com',
    phone: '+1 (555) 456-7890',
    skills: ['React', 'Node.js', 'JavaScript', 'SQL', 'Docker'],
    experience: '3 years',
    matchScore: 79,
    appliedTo: '1',
  },
  {
    id: '5',
    name: 'David Kim',
    title: 'Software Engineer',
    location: 'Seattle, WA',
    email: 'david.kim@email.com',
    phone: '+1 (555) 567-8901',
    skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'Kubernetes'],
    experience: '7 years',
    matchScore: 91,
    appliedTo: '1',
  },
];

export function CandidateMatches({ jobs }: CandidateMatchesProps) {
  const [selectedJob, setSelectedJob] = useState<string>(jobs[0]?.id || '');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const candidates = mockCandidates.filter(c => c.appliedTo === selectedJob);

  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl text-gray-900 mb-2">No job postings yet</h3>
        <p className="text-gray-600">Post a job to see candidate matches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Job Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-2xl text-gray-900 mb-4">AI-Matched Candidates</h2>
        <div>
          <label className="block text-gray-700 mb-2">Select Job Posting:</label>
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl text-purple-600">{candidates.length}</p>
          <p className="text-sm text-gray-600">Total Applicants</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl text-green-600">{candidates.filter(c => c.matchScore >= 85).length}</p>
          <p className="text-sm text-gray-600">High Matches</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl text-yellow-600">{candidates.filter(c => c.matchScore >= 70 && c.matchScore < 85).length}</p>
          <p className="text-sm text-gray-600">Medium Matches</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl text-blue-600">{Math.round(candidates.reduce((acc, c) => acc + c.matchScore, 0) / candidates.length)}%</p>
          <p className="text-sm text-gray-600">Avg Match Score</p>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-xl text-gray-900 mb-4">Candidate Profiles</h3>
        {candidates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No candidates have applied to this position yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
                onClick={() => setSelectedCandidate(candidate)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-lg flex-shrink-0">
                      {candidate.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-lg text-gray-900">{candidate.name}</h4>
                      <p className="text-purple-600">{candidate.title}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>{candidate.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getMatchColor(candidate.matchScore)}`}>
                    <Star className="w-4 h-4" />
                    <span className="text-sm">{candidate.matchScore}% Match</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>{candidate.experience} of experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{candidate.email}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2">Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all text-sm">
                    Contact Candidate
                  </button>
                  <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCandidate(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0">
                {selectedCandidate.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl text-gray-900 mb-1">{selectedCandidate.name}</h2>
                <p className="text-xl text-purple-600 mb-2">{selectedCandidate.title}</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getMatchColor(selectedCandidate.matchScore)}`}>
                  <Star className="w-4 h-4" />
                  <span className="text-sm">{selectedCandidate.matchScore}% Match</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{selectedCandidate.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{selectedCandidate.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{selectedCandidate.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{selectedCandidate.experience} of professional experience</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedCandidate.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-purple-200 mb-6">
              <h4 className="text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">AI</span>
                Why This Candidate?
              </h4>
              <p className="text-sm text-gray-700">
                This candidate has {selectedCandidate.matchScore}% skill match with your requirements and {selectedCandidate.experience} of relevant experience. 
                Strong proficiency in {selectedCandidate.skills.slice(0, 3).join(', ')} makes them an excellent fit for this role.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all">
                Contact Candidate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
