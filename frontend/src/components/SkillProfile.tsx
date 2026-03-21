import { useState } from 'react';
import { Plus, X, Award, Sparkles } from 'lucide-react';
import { Skill } from '../App';

const initialSkills: Skill[] = [
  { name: 'JavaScript', level: 85, category: 'Programming' },
  { name: 'React', level: 80, category: 'Frontend' },
  { name: 'Python', level: 70, category: 'Programming' },
  { name: 'SQL', level: 65, category: 'Database' },
  { name: 'Git', level: 75, category: 'Tools' },
  { name: 'HTML/CSS', level: 90, category: 'Frontend' },
];

export function SkillProfile() {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: '', level: 50, category: 'Programming' });

  const getCategoryAccentClass = (category: string) => {
    switch (category) {
      case 'Programming':
        return 'text-purple-700';
      case 'Frontend':
        return 'text-pink-600';
      case 'Database':
        return 'text-sky-600';
      case 'Tools':
        return 'text-amber-600';
      default:
        return 'text-gray-900';
    }
  };

  const getCategoryBadgeBg = (category: string) => {
    switch (category) {
      case 'Programming':
        return 'bg-purple-100 text-purple-700';
      case 'Frontend':
        return 'bg-pink-100 text-pink-600';
      case 'Database':
        return 'bg-sky-100 text-sky-600';
      case 'Tools':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
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
  const averageLevel = Math.round(skills.reduce((acc, s) => acc + s.level, 0) / skills.length);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Total Skills</span>
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl text-gray-900">{skills.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Categories</span>
            <Sparkles className="w-5 h-5 text-pink-600" />
          </div>
          <p className="text-3xl text-gray-900">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Average Level</span>
            <Award className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl text-gray-900">{averageLevel}%</p>
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900">Your Skills</h2>
          <button
            onClick={() => setShowAddSkill(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>

        {/* Add Skill Form */}
        {showAddSkill && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Skill name"
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <select
                value={newSkill.category}
                onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="Programming">Programming</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Database">Database</option>
                <option value="Tools">Tools</option>
                <option value="Soft Skills">Soft Skills</option>
              </select>
              <div>
                <label className="text-sm text-gray-600">Level: {newSkill.level}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSkill}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddSkill(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Skills by Category */}
        {categories.map(category => (
          <div key={category} className="mb-8 last:mb-0">
            <h3 className={`mb-3 font-semibold ${getCategoryAccentClass(category)}`}>{category}</h3>
            <div className="space-y-4">
              {skills
                .filter(skill => skill.category === category)
                .map(skill => (
                  <div key={skill.name} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-800 font-medium">{skill.name}</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getCategoryBadgeBg(category)}`}>{skill.level}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500 ease-out rounded-full"
                          style={{ width: `${skill.level}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
