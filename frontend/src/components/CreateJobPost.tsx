// @ts-nocheck
import { useState } from 'react';
import { Plus, X, Briefcase, Zap } from 'lucide-react';
import type { JobPosting } from '../App';

interface CreateJobPostProps {
  onCreateJob: (job: JobPosting) => void;
  recruiterName: string;
}

export function CreateJobPost({ onCreateJob, recruiterName }: CreateJobPostProps) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    salary: '',
    description: '',
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || skills.length === 0) {
      alert('Please fill in all required fields and add at least one skill');
      return;
    }

    const newJob: JobPosting = {
      id: Date.now().toString(),
      ...formData,
      requiredSkills: skills,
      postedBy: recruiterName,
      postedDate: new Date().toISOString().split('T')[0],
    };

    onCreateJob(newJob);

    // Reset form
    setFormData({
      title: '',
      company: '',
      location: '',
      type: 'Full-time',
      salary: '',
      description: '',
    });
    setSkills([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-12 relative overflow-hidden">
            {/* AI Glow Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-300 opacity-10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="relative w-16 h-16">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white opacity-30 rounded-xl blur-lg animate-pulse"></div>
                {/* Icon container */}
                <div className="relative w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white border-opacity-20">
                  <Briefcase className="w-8 h-8 text-white" />
                  {/* AI Spark overlay */}
                  <div className="absolute -top-1 -right-1">
                    <Zap className="w-5 h-5 text-yellow-300 drop-shadow-lg fill-yellow-300 animate-pulse" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Create Job Posting</h1>
                <p className="text-purple-100 text-lg">Post a new job opening and find the perfect candidate with AI-powered matching</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Job Basics Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b-2 border-purple-200">Job Basics</h3>
              <div className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Full Stack Developer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. TechCorp Inc."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Location & Job Type */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Remote, San Francisco, CA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Job Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. $100k - $150k"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Job Details Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6 pb-4 border-b-2 border-purple-200">Job Details</h3>
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Job Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={7}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Required Skills <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Enter a skill and press Add"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold flex items-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 rounded-full font-medium">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-purple-900 ml-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Suggestion Box */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-3">
                <span className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">AI</span>
                Recommended Skills
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Based on the job title, these skills are commonly required:
              </p>
              <div className="flex flex-wrap gap-3">
                {['TypeScript', 'React', 'Node.js', 'Git', 'AWS', 'Docker'].map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      if (!skills.includes(skill)) {
                        setSkills([...skills, skill]);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      skills.includes(skill)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                        : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-50'
                    }`}
                    disabled={skills.includes(skill)}
                  >
                    {skills.includes(skill) ? '✓ ' : '+ '}
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Post new job
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
