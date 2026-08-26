
import { useState, useEffect } from 'react';
import { Plus, X, Award, Sparkles, Save, CheckCircle, User, Edit3, Loader2 } from 'lucide-react';
import { Skill, SkillLevel } from '../App';
import { saveSkills, getProfile, updateProfile, getSkillSuggestions, getSkills, getCatalog } from '../services/api';

interface SkillProfileProps {
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  userId: string;
  userName: string;
  userEmail: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR + 2 - i));

type Bucket = 'Core' | 'Secondary' | 'Emerging & Tools';

const BUCKET_STYLE: Record<Bucket, string> = {
  'Core': 'badge-primary',
  'Secondary': 'badge-info',
  'Emerging & Tools': 'badge-secondary',
};

const SKILL_LEVELS: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

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
  const [newSkill, setNewSkill] = useState<{ name: string; level: SkillLevel | '' }>({ name: '', level: '' });
  const [editingSkill, setEditingSkill] = useState<string | null>(null);

  // Catalog: dropdown options + category->bucket map, sourced entirely from
  // GET /api/profile/catalog (backend/models/catalog.py) instead of
  // hardcoded TS constants.
  const [catalog, setCatalog] = useState<{
    education_levels: string[];
    current_statuses: string[];
    cities: string[];
    target_roles: string[];
    category_bucket_map: Record<string, Bucket>;
  }>({
    education_levels: [],
    current_statuses: [],
    cities: [],
    target_roles: [],
    category_bucket_map: {},
  });

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
    loadCatalog();
    if (userId) {
      loadProfile();
      loadSuggestions();
    } else {
      setIsLoadingProfile(false);
    }
  }, [userId]);

  const loadCatalog = async () => {
    try {
      const data = await getCatalog();
      if (data.catalog) {
        setCatalog(data.catalog);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  };

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
      // Backend assigns/normalizes category + bucket on save — refresh
      // local state from the server so display matches what was persisted.
      const refreshed = await getSkills(userId);
      if (refreshed.skills) {
        setSkills(refreshed.skills);
      }
      setSaveSkillSuccess(true);
      setTimeout(() => setSaveSkillSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save skills');
    } finally {
      setIsSavingSkills(false);
    }
  };

  const handleAddSkill = () => {
    const skillName = newSkill.name.trim();
    if (!skillName || !newSkill.level) return;

    const existing = skills.find(s => s.name.trim().toLowerCase() === skillName.toLowerCase());
    if (existing) {
      setSkills(skills.map(s =>
        s.name.trim().toLowerCase() === skillName.toLowerCase()
          ? { ...s, level: newSkill.level as SkillLevel }
          : s
      ));
    } else {
      // Exact-name match against fetched suggestions only, for instant UI
      // feedback. Final category/bucket is authoritative from the backend
      // (auto_categorize in models/catalog.py) once Save Skills is clicked.
      const trimmed = skillName.toLowerCase();
      let category = 'Uncategorized';
      for (const [cat, list] of Object.entries(suggestions)) {
        if (list.some(s => s.toLowerCase() === trimmed)) {
          category = cat;
          break;
        }
      }
      setSkills([...skills, { name: skillName, level: newSkill.level as SkillLevel, category }]);
    }
    setNewSkill({ name: '', level: '' });
    setShowAddSkill(false);
  };

  const getBucketForCategory = (category: string): Bucket => {
    return catalog.category_bucket_map[category] || 'Secondary';
  };

  const categories = Array.from(new Set(skills.map(s => s.category)));
  const bucketOrder: Bucket[] = ['Core', 'Secondary', 'Emerging & Tools'];

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* Profile Header */}
      <div className="bg-linear-to-r from-primary to-secondary text-primary-content rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-base-100/20 rounded-full flex items-center justify-center text-2xl font-medium">
            {userName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl">{userName}</h2>
            <p className="opacity-75 text-sm">{userEmail}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {profileInfo.current_status && (
                <span className="text-xs bg-base-100/20 px-2 py-0.5 rounded-full">{profileInfo.current_status}</span>
              )}
              {profileInfo.primary_role && (
                <span className="text-xs bg-base-100/20 px-2 py-0.5 rounded-full">🎯 {profileInfo.primary_role}</span>
              )}
              {profileInfo.location && (
                <span className="text-xs bg-base-100/20 px-2 py-0.5 rounded-full">📍 {profileInfo.location}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="bg-base-100 rounded-xl shadow-sm p-1 flex gap-1">
        <button
          onClick={() => setActiveSection('info')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${activeSection === 'info'
            ? 'bg-linear-to-r from-primary to-secondary text-primary-content'
            : 'text-base-content/60 hover:bg-base-200'
            }`}
        >
          <User className="w-4 h-4" />
          Basic Information
        </button>
        <button
          onClick={() => setActiveSection('skills')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all ${activeSection === 'skills'
            ? 'bg-linear-to-r from-primary to-secondary text-primary-content'
            : 'text-base-content/60 hover:bg-base-200'
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
            <div className="bg-base-100 rounded-xl p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : (
            <>
              {/* Basic Info Card */}
              <div className="bg-base-100 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base-content font-medium">Basic Information</h3>
                  {!isEditingInfo ? (
                    <button
                      onClick={() => setIsEditingInfo(true)}
                      className="flex items-center gap-2 px-4 py-1.5 border border-primary/30 text-primary rounded-lg hover:bg-primary/10 text-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingInfo(false)}
                        className="px-3 py-1.5 border border-base-300 text-base-content/60 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveInfo}
                        disabled={isSavingInfo}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-content rounded-lg text-sm"
                      >
                        {isSavingInfo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {saveInfoSuccess && (
                  <div className="mb-4 flex items-center gap-2 text-success bg-success/10 border border-success/30 rounded-lg px-4 py-2 text-sm">
                    <CheckCircle className="w-4 h-4" /> Profile saved successfully!
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Name - readonly */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Full Name</label>
                    <input value={userName} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                  </div>

                  {/* Email - readonly */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Email</label>
                    <input value={userEmail} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                  </div>

                  {/* Education */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Education</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.education}
                        onChange={e => setProfileInfo({ ...profileInfo, education: e.target.value })}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      >
                        <option value="">Select education</option>
                        {catalog.education_levels.map(e => <option key={e}>{e}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.education || '—'} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                    )}
                  </div>

                  {/* Education Status */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Education Status</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.education_status}
                        onChange={e => setProfileInfo({ ...profileInfo, education_status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      >
                        <option>Completed</option>
                        <option>Pursuing</option>
                      </select>
                    ) : (
                      <input value={profileInfo.education_status || '—'} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                    )}
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Graduation Year</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.graduation_year}
                        onChange={e => setProfileInfo({ ...profileInfo, graduation_year: e.target.value })}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      >
                        {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.graduation_year || '—'} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                    )}
                  </div>

                  {/* Current Status */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Current Status</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.current_status}
                        onChange={e => setProfileInfo({ ...profileInfo, current_status: e.target.value })}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      >
                        {catalog.current_statuses.map(s => <option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.current_status || '—'} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                    )}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Location</label>
                    {isEditingInfo ? (
                      <select
                        value={profileInfo.location}
                        onChange={e => setProfileInfo({ ...profileInfo, location: e.target.value })}
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      >
                        <option value="">Select city</option>
                        {catalog.cities.map(c => <option key={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input value={profileInfo.location || '—'} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">Phone</label>
                    {isEditingInfo ? (
                      <input
                        type="tel"
                        value={profileInfo.phone}
                        onChange={e => setProfileInfo({ ...profileInfo, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      />
                    ) : (
                      <input value={profileInfo.phone || '—'} readOnly className="w-full px-4 py-2.5 border border-base-300 rounded-lg bg-base-200 text-base-content/70 text-sm" />
                    )}
                  </div>
                </div>
              </div>

              {/* Target Roles Card */}
              <div className="bg-base-100 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base-content font-medium">🎯 Target Career Roles</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{profileInfo.target_roles?.length || 0}/3 Roles</span>
                </div>
                <p className="text-xs text-base-content/50 mb-4">Add up to 3 roles. Your primary role powers default AI recommendations.</p>

                {isEditingInfo ? (
                  <div className="space-y-3">
                    {/* List existing roles */}
                    {(profileInfo.target_roles || []).map((role, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-base-200 p-2 rounded-lg border border-base-300">
                        <span className="flex-1 text-sm text-base-content/70 px-2">{role}</span>

                        {/* Primary Badge or Button */}
                        {profileInfo.primary_role === role ? (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Primary</span>
                        ) : (
                          <button
                            onClick={() => setProfileInfo(prev => ({ ...prev, primary_role: role }))}
                            className="text-xs text-base-content/50 hover:text-primary px-2 transition-colors"
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
                          className="text-base-content/40 hover:text-error p-1 transition-colors"
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
                        className="w-full px-4 py-2.5 border border-dashed border-primary/40 text-primary rounded-lg focus:outline-none focus:border-primary text-sm bg-primary/5 cursor-pointer"
                      >
                        <option value="">+ Add a target role</option>
                        {catalog.target_roles.filter(r => !(profileInfo.target_roles || []).includes(r)).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(profileInfo.target_roles || []).length > 0 ? (
                      profileInfo.target_roles.map((role, idx) => (
                        <div key={idx} className={`px-4 py-2 rounded-xl text-sm border flex items-center gap-2 ${profileInfo.primary_role === role
                          ? 'bg-primary/10 border-primary/30 text-primary font-medium shadow-sm'
                          : 'bg-base-200 border-base-300 text-base-content/60'
                          }`}>
                          {profileInfo.primary_role === role && <span className="text-base leading-none">⭐</span>}
                          {role}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 rounded-xl text-sm bg-base-200 border border-base-300 text-base-content/50 w-full">
                        Not set — click Edit to choose up to 3 roles
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Links Card */}
              <div className="bg-base-100 rounded-xl shadow-sm p-6">
                <h3 className="text-base-content font-medium mb-4">🔗 Professional Links</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">LinkedIn URL</label>
                    {isEditingInfo ? (
                      <input
                        type="url"
                        value={profileInfo.linkedin}
                        onChange={e => setProfileInfo({ ...profileInfo, linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourname"
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      />
                    ) : (
                      profileInfo.linkedin
                        ? <a href={profileInfo.linkedin} target="_blank" rel="noreferrer" className="text-sm text-info hover:underline">{profileInfo.linkedin}</a>
                        : <span className="text-sm text-base-content/40">Not added</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-base-content/50 mb-1">GitHub URL</label>
                    {isEditingInfo ? (
                      <input
                        type="url"
                        value={profileInfo.github}
                        onChange={e => setProfileInfo({ ...profileInfo, github: e.target.value })}
                        placeholder="https://github.com/yourusername"
                        className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                      />
                    ) : (
                      profileInfo.github
                        ? <a href={profileInfo.github} target="_blank" rel="noreferrer" className="text-sm text-info hover:underline">{profileInfo.github}</a>
                        : <span className="text-sm text-base-content/40">Not added</span>
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
          <div className="bg-info/10 border border-info/30 rounded-xl p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-info shrink-0 mt-0.5" />
              <p className="text-sm text-base-content/80">
                Add your real skills. <strong>Gap Analysis</strong> and <strong>Career Path</strong> tabs use these for personalised AI recommendations.
              </p>
            </div>
            <button
              onClick={handleSaveSkills}
              disabled={isSavingSkills}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content rounded-lg text-sm shrink-0 hover:bg-primary/80 disabled:opacity-50"
            >
              {isSavingSkills ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSkillSuccess ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saveSkillSuccess ? 'Saved!' : 'Save Skills'}
            </button>
          </div>

          {/* Quick add from suggestions */}
          {Object.keys(suggestions).length > 0 && (
            <div className="bg-base-100 rounded-xl shadow-sm p-5">
              <h3 className="text-base-content text-sm font-medium mb-3">Quick Add Popular Skills</h3>
              <div className="space-y-2">
                {Object.entries(suggestions).slice(0, 3).map(([cat, skillList]) => (
                  <div key={cat}>
                    <p className="text-xs text-base-content/50 mb-1">{cat}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(skillList as string[]).slice(0, 6).map(s => {
                        const alreadyAdded = skills.some(sk => sk.name === s);
                        return (
                          <button
                            key={s}
                            disabled={alreadyAdded}
                            onClick={() => { if (!alreadyAdded) { setNewSkill({ name: s, level: '' }); setShowAddSkill(true); } }}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-all ${alreadyAdded
                              ? 'bg-success/10 border-success/30 text-success cursor-default'
                              : 'border-base-300 text-base-content/60 hover:border-primary/40 hover:bg-primary/10 hover:text-primary'
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

          {/* Skills grouped by Core / Secondary / Emerging & Tools */}
          {bucketOrder.map(bucket => {
            const bucketCategories = categories.filter(c => getBucketForCategory(c) === bucket);
            if (bucketCategories.length === 0) return null;
            return (
              <div key={bucket} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`badge ${BUCKET_STYLE[bucket]} badge-sm`}>{bucket}</span>
                  <span className="text-xs text-base-content/40">
                    {skills.filter(s => bucketCategories.includes(s.category)).length} skills
                  </span>
                </div>
                {bucketCategories.map(category => (
                  <div key={category} className="bg-base-100 rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-medium text-primary">{category}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {skills.filter(s => s.category === category).length} skills
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {skills.filter(s => s.category === category).map(skill => (
                        <div key={skill.name} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-base-content/80">{skill.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            {editingSkill === skill.name ? (
                              <select
                                value={skill.level}
                                onChange={e => {
                                  setSkills(skills.map(s => s.name === skill.name ? { ...s, level: e.target.value as SkillLevel } : s));
                                  setEditingSkill(null);
                                }}
                                onBlur={() => setEditingSkill(null)}
                                autoFocus
                                className="select select-xs border-base-300 focus:outline-none bg-base-100 text-xs"
                              >
                                {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                              </select>
                            ) : (
                              <span
                                onClick={() => setEditingSkill(skill.name)}
                                className={`badge badge-sm cursor-pointer ${skill.level === 'Expert' ? 'badge-primary' :
                                  skill.level === 'Advanced' ? 'badge-info' :
                                    skill.level === 'Intermediate' ? 'badge-secondary' : 'badge-ghost'
                                  }`}
                                title="Click to edit level"
                              >
                                {skill.level}
                              </span>
                            )}
                            <button
                              onClick={() => setSkills(skills.filter(s => s.name !== skill.name))}
                              className="text-base-content/30 hover:text-error transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Add Skill Form */}
          {showAddSkill ? (
            <div className="bg-base-100 rounded-xl shadow-sm p-5">
              <h3 className="text-base-content text-sm font-medium mb-4">Add New Skill</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-base-content/50 mb-1">Skill Name</label>
                  <input
                    type="text"
                    placeholder="e.g. TypeScript, Docker, AWS..."
                    value={newSkill.name}
                    onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                    onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                    className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-base-content/50 mb-1">Proficiency Level</label>
                  <select
                    value={newSkill.level}
                    onChange={e => setNewSkill({ ...newSkill, level: e.target.value as SkillLevel })}
                    className="w-full px-4 py-2.5 border border-base-300 rounded-lg focus:outline-none focus:border-primary text-sm bg-base-100"
                  >
                    <option value="">Select level</option>
                    {SKILL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <p className="text-xs text-base-content/40">Category is auto-assigned based on the skill name.</p>
                <div className="flex gap-2">
                  <button onClick={handleAddSkill} className="flex-1 bg-linear-to-r from-primary to-secondary text-primary-content py-2.5 rounded-lg text-sm hover:shadow-lg">
                    Add Skill
                  </button>
                  <button onClick={() => setShowAddSkill(false)} className="px-5 py-2.5 border border-base-300 text-base-content/60 rounded-lg text-sm hover:bg-base-200">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSkill(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-primary/40 text-primary rounded-xl hover:border-primary hover:bg-primary/10 transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> Add Custom Skill
            </button>
          )}
        </div>
      )}
    </div>
  );
}