import { useState } from 'react';
import { Plus, X, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { JobPosting } from '../App';
import { createJob, polishJobDescription, getRecommendedSkillsForRole } from '../services/api';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendedSkills, setRecommendedSkills] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ title?: string; company?: string; skills?: string }>({});

  const fetchRoleSkills = async (role: string) => {
    if (!role.trim()) {
      setRecommendedSkills([]);
      return;
    }
    setRecommendedSkills([]);
    const res = await getRecommendedSkillsForRole(role.trim()).catch(() => null);
    if (res?.skills?.length) setRecommendedSkills(res.skills);
  };

  const handlePolishDescription = async () => {
    if (!formData.description.trim()) {
      toast.error('Write a draft description first, then polish it.');
      return;
    }
    setIsPolishing(true);
    try {
      const data = await polishJobDescription(formData.title, formData.description, skills);
      if (data.polished_description) {
        setFormData({ ...formData, description: data.polished_description });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to polish description');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
      setErrors(previous => ({ ...previous, skills: undefined }));
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  // UPDATED: Now an async function that sends data to FastAPI via authenticated API helper
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      ...(!formData.title.trim() && { title: 'Job title is required.' }),
      ...(!formData.company.trim() && { company: 'Company name is required.' }),
      ...(skills.length === 0 && { skills: 'Add at least one required skill.' }),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
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
      setIsSubmitting(true);
      // 2. Send to FastAPI jobs route with Supabase Auth headers
      const data = await createJob(requestBody);

      // 3. Update the React UI using the job backend returned
      if (data.success && data.job) {
        onCreateJob(data.job);
      } else {
        throw new Error('The job could not be created.');
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

      toast.success('Job successfully posted');

    } catch (error: any) {
      console.error("Error posting job:", error);
      toast.error(error.message || 'There was an error posting the job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-base-100 rounded-2xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-linear-to-r from-primary to-secondary px-6 sm:px-8 py-5">
          <h2 className="text-2xl font-bold text-primary-content">Create Job Posting</h2>
          <p className="text-primary-content/80 text-sm mt-1">Find the right candidate with AI-powered matching.</p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} noValidate className="p-8 space-y-8">
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
                  onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors(previous => ({ ...previous, title: undefined })); }}
                  onBlur={() => fetchRoleSkills(formData.title)}
                  placeholder="e.g. Senior Full Stack Developer"
                  className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent "
                  required
                />
                {errors.title && <p className="text-error text-sm mt-1">{errors.title}</p>}
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-semibold text-base-content/80 mb-3">
                  Company Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => { setFormData({ ...formData, company: e.target.value }); setErrors(previous => ({ ...previous, company: undefined })); }}
                  placeholder="e.g. TechCorp Inc."
                  className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent "
                  required
                />
                {errors.company && <p className="text-error text-sm mt-1">{errors.company}</p>}
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
                    className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent "
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-base-content/80 mb-3">Job Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent "
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
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
                  className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent "
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
                  className="w-full px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent  resize-none"
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
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    placeholder="Enter a skill and press Add"
                    className="flex-1 px-4 py-3 border border-base-300 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent "
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-primary text-primary-content rounded-lg hover:opacity-90  font-semibold flex items-center gap-2 shadow-md"
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
                {errors.skills && <p className="text-error text-sm mt-2">{errors.skills}</p>}
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
              {!formData.title.trim()
                ? 'Type a job title to get skill suggestions.'
                : recommendedSkills.length === 0
                  ? 'No suggestions yet. Add the skills you need above.'
                  : `Based on "${formData.title.trim()}", these skills are commonly required:`}
            </p>
            <div className="flex flex-wrap gap-3">
              {recommendedSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => {
                    if (!skills.includes(skill)) {
                      setSkills([...skills, skill]);
                      setErrors(previous => ({ ...previous, skills: undefined }));
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
            disabled={isSubmitting}
            className="w-full py-4 bg-linear-to-r from-primary to-secondary text-primary-content font-bold text-lg rounded-lg hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
            {isSubmitting ? 'Posting...' : 'Post new job'}
          </button>
        </form>
      </div>
    </div>
  );
}
