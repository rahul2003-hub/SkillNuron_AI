import { useState, useEffect } from 'react';
import { Plus, X, Award, Sparkles, Save, CheckCircle, User, Edit3, Loader2 } from 'lucide-react';
import { Skill } from '../App';
import { saveSkills, getProfile, updateProfile, getSkillSuggestions } from '../services/api';

interface SkillProfileProps {
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  userId: string;
  userName: string;
  userEmail: string;
}

const EDUCATION_OPTIONS = ["BCA", "MCA", "B.Tech", "M.Tech", "B.Sc", "M.Sc", "BBA", "MBA", "B.Com", "Diploma", "Other"];
const STATUS_OPTIONS = ["Student", "Fresher", "Working Professional", "Freelancer"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR + 2 - i));
const CITY_OPTIONS = ["Mumbai", "Pune", "Navi Mumbai", "Bangalore", "Hyderabad", "Noida", "Chennai", "Delhi", "Kolkata", "Ahmedabad", "Other"];
const TARGET_ROLES = [
  "Full Stack Developer", "Frontend Developer", "Backend Developer",
  "Python Developer", "Data Scientist", "ML Engineer", "DevOps Engineer",
  "Cloud Engineer", "UI/UX Designer", "Product Manager", "QA Engineer",
  "Android Developer", "iOS Developer", "Cybersecurity Analyst"
];

export function SkillProfile({ skills, setSkills, userId, userName, userEmail }: SkillProfileProps) {
  const [activeSection, setActiveSection] = useState<'info' | 'skills'>('info');
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingSkills, setIsSavingSkills] = useState(false);
  const [saveSkillSuccess, setSaveSkillSuccess] = useState(false);
  const [saveInfoSuccess, setSaveInfoSuccess] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: 'Programming' });

  const [profileInfo, setProfileInfo] = useState({
    education: '',
    education_status: 'Completed',
    graduation_year: String(CURRENT_YEAR),
    current_status: 'Fresher',
    target_roles: [] as string[],
    primary_role: '',
    location: '',
    phone: '',
    linkedin: '',
    github: '',
  });

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadSuggestions();
    }
  }, [userId]);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await getProfile(userId);
      if (data.profile) {
        setProfileInfo(prev => ({ ...prev, ...data.profile }));
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const data = await getSkillSuggestions();
      setSuggestions(data.suggestions || {});
    } catch (err) {
      console.error('Failed to load suggestions');
    }
  };

  const handleSaveInfo = async () => {
    setIsSavingInfo(true);
    try {
      await updateProfile(userId, profileInfo);
      setSaveInfoSuccess(true);
      setIsEditingInfo(false);
      setTimeout(() => setSaveInfoSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleSaveSkills = async () => {
    if (!userId) return;
    setIsSavingSkills(true);
    try {
      await saveSkills(userId, skills);
      setSaveSkillSuccess(true);
      setTimeout(() => setSaveSkillSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save skills');
    } finally {
      setIsSavingSkills(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, { ...newSkill, name: newSkill.name.trim() }]);
      setNewSkill({ name: '', level: 50, category: 'Programming' });
      setShowAddSkill(false);
    }
  };

  const categories = Array.from(new Set(skills.map(s => s.category)));

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-medium">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl">{userName}</h2>
            <p className="opacity-75 text-sm">{userEmail}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {profileInfo.current_status && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{profileInfo.current_status}</span>
              )}
              {profileInfo.primary_role && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">🎯 {profileInfo.primary_role}</span>
              )}
              {profileInfo.location && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">📍 {profileInfo.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1">
        <button
          onClick={() => setActiveSection('info')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
            activeSection === 'info'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <User className="w-4 h-4" />
          Basic Information
        </button>
        <button
          onClick={() => setActiveSection('skills')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${
            activeSection === 'skills'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Skills ({skills.length})
        </button>
      </div>

      {/* BASIC INFORMATION SECTION */}
      {activeSection === 'info' && (
        <div className="space-y-4">
          {isLoadingProfile ? (
            <div className="bg-white rounded-xl p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Basic Info Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-gray-900 font-medium">Basic Information</h3>
                  {!isEditingInfo ? (
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="flex items-center gap-2 px-4 py-1.5 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 text-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingInfo(false)}
                        className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveInfo}
                        disabled={isSavingInfo}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm"
                      >
                        {isSavingInfo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {saveInfoSuccess && (
                  <div className="mb-4 flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
                    <CheckCircle className="w-4 h-4" /> Profile saved successfully!
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Name - readonly */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                    <input value={userName} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                  </div>

                  {/* Email - readonly */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input value={userEmail} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                  </div>

                  {/* Education */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Education</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.education}
                        onChange={e => setProfileInfo({ ...profileInfo, education: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      >
                        <option value="">Select education</option>
                        {EDUCATION_OPTIONS.map(e => <option key={e}>{e}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.education || '—'} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                    )}
                  </div>

                  {/* Education Status */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Education Status</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.education_status}
                        onChange={e => setProfileInfo({ ...profileInfo, education_status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      >
                        <option>Completed</option>
                        <option>Pursuing</option>
                      </select>
                    ) : (
                      <input value={profileInfo.education_status || '—'} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                    )}
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Graduation Year</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.graduation_year}
                        onChange={e => setProfileInfo({ ...profileInfo, graduation_year: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      >
                        {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.graduation_year || '—'} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                    )}
                  </div>

                  {/* Current Status */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Current Status</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.current_status}
                        onChange={e => setProfileInfo({ ...profileInfo, current_status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      >
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.current_status || '—'} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Location</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.location}
                        onChange={e => setProfileInfo({ ...profileInfo, location: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      >
                        <option value="">Select city</option>
                        {CITY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.location || '—'} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    {isEditingInfo ? (
                      <input
                        type="tel"
                        value={profileInfo.phone}
                        onChange={e => setProfileInfo({ ...profileInfo, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      />
                    ) : (
                      <input value={profileInfo.phone || '—'} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm" />
                    )}
                  </div>
                </div>
              </div>

              {/* Target Roles Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 font-medium">🎯 Target Career Roles</h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{profileInfo.target_roles?.length || 0}/3 Roles</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">Add up to 3 roles. Your primary role powers default AI recommendations.</p>

                {isEditingInfo ? (
                  <div className="space-y-3">
                    {/* List existing roles */}
                    {(profileInfo.target_roles || []).map((role, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                        <span className="flex-1 text-sm text-gray-700 px-2">{role}</span>
                        
                        {/* Primary Badge or Button */}
                        {profileInfo.primary_role === role ? (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Primary</span>
                        ) : (
                          <button
                            onClick={() => setProfileInfo(prev => ({ ...prev, primary_role: role }))}
                            className="text-xs text-gray-500 hover:text-purple-600 px-2 transition-colors"
                          >
                            Make Primary
                          </button>
                        )}
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => {
                            const newRoles = profileInfo.target_roles.filter(r => r !== role);
                            const newPrimary = profileInfo.primary_role === role ? (newRoles[0] || "") : profileInfo.primary_role;
                            setProfileInfo(prev => ({ ...prev, target_roles: newRoles, primary_role: newPrimary }));
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add new role dropdown (hidden if user already has 3) */}
                    {(profileInfo.target_roles || []).length < 3 && (
                      <select
                        value=""
                        onChange={e => {
                          const selected = e.target.value;
                          if (!selected) return;
                          const currentRoles = profileInfo.target_roles || [];
                          if (currentRoles.includes(selected)) return;
                          
                          const newRoles = [...currentRoles, selected];
                          const newPrimary = profileInfo.primary_role ? profileInfo.primary_role : selected;
                          
                          setProfileInfo(prev => ({ ...prev, target_roles: newRoles, primary_role: newPrimary }));
                        }}
                        className="w-full px-4 py-2.5 border border-dashed border-purple-300 text-purple-700 rounded-lg focus:outline-none focus:border-purple-500 text-sm bg-purple-50 cursor-pointer"
                      >
                        <option value="">+ Add a target role</option>
                        {TARGET_ROLES.filter(r => !(profileInfo.target_roles || []).includes(r)).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profileInfo.target_roles || []).length > 0 ? (
                      profileInfo.target_roles.map((role, idx) => (
                        <div key={idx} className={`px-4 py-2 rounded-xl text-sm border flex items-center gap-2 ${
                          profileInfo.primary_role === role
                            ? 'bg-purple-50 border-purple-200 text-purple-800 font-medium shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}>
                          {profileInfo.primary_role === role && <span className="text-base leading-none">⭐</span>}
                          {role}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 rounded-xl text-sm bg-gray-50 border border-gray-200 text-gray-500 w-full">
                        Not set — click Edit to choose up to 3 roles
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Links Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-gray-900 font-medium mb-4">🔗 Professional Links</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">LinkedIn URL</label>
                    {isEditingInfo ? (
                      <input
                        type="url"
                        value={profileInfo.linkedin}
                        onChange={e => setProfileInfo({ ...profileInfo, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourname"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      />
                    ) : (
                      profileInfo.linkedin
                        ? <a href={profileInfo.linkedin} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">{profileInfo.linkedin}</a>
                        : <span className="text-sm text-gray-400">Not added</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">GitHub URL</label>
                    {isEditingInfo ? (
                      <input
                        type="url"
                        value={profileInfo.github}
                        onChange={e => setProfileInfo({ ...profileInfo, github: e.target.value })}
                        placeholder="https://github.com/yourusername"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      />
                    ) : (
                      profileInfo.github
                        ? <a href={profileInfo.github} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">{profileInfo.github}</a>
                        : <span className="text-sm text-gray-400">Not added</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* SKILLS SECTION */}
      {activeSection === 'skills' && (
        <div className="space-y-4">
          {/* Info banner + Save */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Add your real skills. <strong>Gap Analysis</strong> and <strong>Career Path</strong> tabs use these for personalised AI recommendations.
              </p>
            </div>
            <button
              onClick={handleSaveSkills}
              disabled={isSavingSkills}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm flex-shrink-0 hover:bg-purple-700 disabled:opacity-50"
            >
              {isSavingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSkillSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSkillSuccess ? 'Saved!' : 'Save Skills'}
            </button>
          </div>

          {/* Quick add from suggestions */}
          {Object.keys(suggestions).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-gray-900 text-sm font-medium mb-3">Quick Add Popular Skills</h3>
              <div className="space-y-2">
                {Object.entries(suggestions).slice(0, 3).map(([cat, skillList]) => (
                  <div key={cat}>
                    <p className="text-xs text-gray-500 mb-1">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(skillList as string[]).slice(0, 6).map(s => {
                        const alreadyAdded = skills.some(sk => sk.name === s);
                        return (
                          <button
                            key={s}
                            disabled={alreadyAdded}
                            onClick={() => !alreadyAdded && setSkills([...skills, { name: s, level: 70, category: cat }])}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                              alreadyAdded
                                ? 'bg-green-50 border-green-200 text-green-600 cursor-default'
                                : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700'
                            }`}
                          >
                            {alreadyAdded ? '✓ ' : '+ '}{s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills by category */}
          {categories.map(category => (
            <div key={category} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-purple-700">{category}</span>
                <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  {skills.filter(s => s.category === category).length} skills
                </span>
              </div>
              <div className="space-y-3">
                {skills.filter(s => s.category === category).map(skill => (
                  <div key={skill.name} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-700">{skill.name}</span>
                        <span className="text-xs text-gray-500">{skill.level}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => setSkills(skills.filter(s => s.name !== skill.name))}
                      className="text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Add Skill Form */}
          {showAddSkill ? (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-gray-900 text-sm font-medium mb-4">Add New Skill</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g. TypeScript, Docker, AWS..."
                    value={newSkill.name}
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Proficiency: {newSkill.level}%</label>
                  <input
                    type="range" min="0" max="100"
                    value={newSkill.level}
                    onChange={e => setNewSkill({ ...newSkill, level: Number(e.target.value) })}
                    className="w-full accent-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                  >
                    {Object.keys(suggestions).length > 0
                      ? Object.keys(suggestions).map(c => <option key={c}>{c}</option>)
                      : ['Programming', 'Frontend', 'Backend', 'Database', 'DevOps & Cloud', 'AI & Data', 'Tools'].map(c => <option key={c}>{c}</option>)
                    }
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddSkill} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg text-sm hover:shadow-lg">
                    Add Skill
                  </button>
                  <button onClick={() => setShowAddSkill(false)} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSkill(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Add Custom Skill
            </button>
          )}
        </div>
      )}
    </div>
  );
}