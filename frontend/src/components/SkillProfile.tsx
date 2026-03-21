import { useState } from 'react';
import { Plus, X, Award, Sparkles } from 'lucide-react';
import { Skill } from '../App';

interface SkillProfileProps {
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
}

export function SkillProfile({ skills, setSkills }: SkillProfileProps) {
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: 'Programming' });

  const getCategoryAccentClass = (category: string) => {
    switch (category) {
      case 'Programming': return 'text-purple-700';
      case 'Frontend': return 'text-pink-600';
      case 'Database': return 'text-sky-600';
      case 'Tools': return 'text-amber-600';
      default: return 'text-gray-900';
    }
  };

  const getCategoryBadgeBg = (category: string) => {
    switch (category) {
      case 'Programming': return 'bg-purple-100 text-purple-700';
      case 'Frontend': return 'bg-pink-100 text-pink-600';
      case 'Database': return 'bg-sky-100 text-sky-600';
      case 'Tools': return 'bg-amber-100 text-amber-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, { ...newSkill, name: newSkill.name.trim() }]);
      setNewSkill({ name: '', level: 50, category: 'Programming' });
      setShowAddSkill(false);
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter(s => s.name !== skillName));
  };

  const categories = Array.from(new Set(skills.map(s => s.category)));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl mb-1">My Skill Profile</h2>
            <p className="opacity-90 text-sm">
              {skills.length} skills added · These are shared with Gap Analysis and Career Path tabs
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Add your real skills here. The <strong>Gap Analysis</strong> and <strong>Career Path</strong> tabs will use these skills to give you personalised AI recommendations.
        </p>
      </div>

      {/* Skills by category */}
      {categories.map(category => (
        <div key={category} className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-lg font-medium ${getCategoryAccentClass(category)}`}>
              {category}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadgeBg(category)}`}>
              {skills.filter(s => s.category === category).length} skills
            </span>
          </div>
          <div className="space-y-3">
            {skills.filter(s => s.category === category).map(skill => (
              <div key={skill.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-700">{skill.name}</span>
                    <span className="text-sm text-gray-500">{skill.level}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add Skill */}
      {showAddSkill ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-gray-900 mb-4">Add New Skill</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Skill Name</label>
              <input
                type="text"
                placeholder="e.g. TypeScript, Docker, AWS..."
                value={newSkill.name}
                onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Proficiency Level: {newSkill.level}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={newSkill.level}
                onChange={e => setNewSkill({ ...newSkill, level: Number(e.target.value) })}
                className="w-full accent-purple-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Category</label>
              <select
                value={newSkill.category}
                onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-400"
              >
                <option>Programming</option>
                <option>Frontend</option>
                <option>Database</option>
                <option>Tools</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddSkill}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:shadow-lg transition-all"
              >
                Add Skill
              </button>
              <button
                onClick={() => setShowAddSkill(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSkill(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-purple-300 text-purple-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Skill
        </button>
      )}
    </div>
  );
}