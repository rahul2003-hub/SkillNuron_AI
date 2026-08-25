import { useState } from 'react';
import { Plus, X, Briefcase, Zap, Sparkles, Loader2 } from 'lucide-react';
import type { JobPosting } from '../App';
import { createJob, polishJobDescription } from '../services/api';

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
  const [isPolishing, setIsPolishing] = useState(false);

  const handlePolishDescription = async () => {
    if (!formData.description.trim()) {
      alert('Write a draft description first, then polish it.');
      return;
    }
    setIsPolishing(true);
    try {
      const data = await polishJobDescription(formData.title, formData.description, skills);
      if (data.polished_description) {
        setFormData({ ...formData, description: data.polished_description });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to polish description');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // UPDATED: Now an async function that sends data to FastAPI via authenticated API helper
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || skills.length === 0) {
      alert('Please fill in all required fields and add at least one skill');
      return;
    }

    // 1. Format the data EXACTLY as FastAPI JobPostingRequest expects (snake_case)
    const requestBody = {
      title: formData.title,
      company: formData.company,
      location: formData.location,
      type: formData.type,
      salary: formData.salary,
      description: formData.description,
      required_skills: skills,      // snake_case to match backend
      posted_by: recruiterName      // snake_case to match backend
    };

    try {
      // 2. Send to FastAPI jobs route with Supabase Auth headers
      const data = await createJob(requestBody);

      // 3. Update the React UI using the job backend returned
      if (data.success && data.job) {
        onCreateJob(data.job);
      }

      // 5. Reset form
      setFormData({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        salary: '',
        description: '',
      });
      setSkills([]);

      alert('Job successfully posted and saved to database!');

    } catch (error) {
      console.error("Error posting job:", error);
      alert('There was an error posting the job. Make sure your FastAPI backend is running!');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-linear-to-r from-primary to-secondary px-8 py-12 relative overflow-hidden">
            {/* AI Glow Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-base-100 opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary opacity-10 rounded-full blur-3xl -ml-32 -mb-32"></div>

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="relative w-16 h-16">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-base-100 opacity-30 rounded-xl blur-lg animate-pulse"></div>
                {/* Icon container */}
                <div className="relative w-16 h-16 bg-base-100 bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-primary-content border-opacity-20">
                  <Briefcase className="w-8 h-8 text-primary-content" />
                  {/* AI Spark overlay */}
                  <div className="absolute -top-1 -right-1">
                    <Zap className="w-5 h-5 text-warning drop-shadow-lg fill-warning animate-pulse" style={{ animationDuration: '2s' }} />
                  </div>
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-primary-content mb-2">Create Job Posting</h1>
                <p className="text-primary-content/80 text-lg">Post a new job opening and find the perfect candidate with AI-powered matching</p>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Job Basics Section */}
            <div>
              <h3 className="text-xl font-semibold text-base-content mb-6 pb-4 border-b-2 border-primary/20">Job Basics</h3>
              <div className="space-y-4">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-semibold text-base-content/80 mb-3">
                    Job Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Senior Full Stack Developer"
                    className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-semibold text-base-content/80 mb-3">
                    Company Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. TechCorp Inc."
                    className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>

                {/* Location & Job Type */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-3">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Remote, San Francisco, CA"
                      className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-base-content/80 mb-3">Job Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
                  <label className="block text-sm font-semibold text-base-content/80 mb-3">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="e.g. ₹5,00,000 - ₹8,00,000"
                    className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Job Details Section */}
            <div>
              <h3 className="text-xl font-semibold text-base-content mb-6 pb-4 border-b-2 border-primary/20">Job Details</h3>
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-base-content/80">Job Description</label>
                    <button
                      type="button"
                      onClick={handlePolishDescription}
                      disabled={isPolishing}
                      className="btn btn-xs btn-outline btn-primary gap-1"
                    >
                      {isPolishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {isPolishing ? 'Polishing...' : 'AI Polish'}
                    </button>
                  </div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={7}
                    className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-semibold text-base-content/80 mb-3">
                    Required Skills <span className="text-error">*</span>
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      placeholder="Enter a skill and press Add"
                      className="flex-1 px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-6 py-3 bg-primary text-primary-content rounded-lg hover:opacity-90 transition-all font-semibold flex items-center gap-2 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-2 px-4 py-2 bg-linear-to-r from-primary/10 to-secondary/10 text-primary border border-primary/20 rounded-full font-medium">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:opacity-70 ml-1"
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
            <div className="bg-linear-to-br from-info/10 via-primary/10 to-secondary/10 rounded-xl p-6 border border-primary/20 shadow-sm">
              <h4 className="text-lg font-semibold text-base-content mb-3 flex items-center gap-3">
                <span className="w-8 h-8 bg-linear-to-r from-primary to-secondary text-primary-content rounded-lg flex items-center justify-center text-sm font-bold">AI</span>
                Recommended Skills
              </h4>
              <p className="text-sm text-base-content/70 mb-4">
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
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${skills.includes(skill)
                        ? 'bg-linear-to-r from-primary to-secondary text-primary-content shadow-md'
                        : 'bg-base-100 text-primary border border-primary/30 hover:bg-primary/10'
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
              className="w-full py-4 bg-linear-to-r from-primary to-secondary text-primary-content font-bold text-lg rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Post new job
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}