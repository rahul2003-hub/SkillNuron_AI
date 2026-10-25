import { useEffect, useState } from 'react';
import { Building2, Edit3, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react';
import { DeleteAccountButton } from './DeleteAccountButton';
import { getProfile, updateProfile } from '../services/api';

interface RecruiterProfileProps {
  userName: string;
  userEmail: string;
  onAccountDeleted: () => void;
}

export function RecruiterProfile({ userName, userEmail, onAccountDeleted }: RecruiterProfileProps) {
  const [profile, setProfile] = useState({ name: userName, location: '', phone: '', linkedin: '', github: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getProfile('me').then(data => setProfile(previous => ({ ...previous, name: data.user?.name || userName, ...(data.profile || {}) }))).catch(() => undefined);
  }, []);

  const save = async () => {
    setSaving(true); setMessage('');
    try {
      await updateProfile('me', { ...profile, target_roles: [], primary_role: '', education: '', education_status: '', graduation_year: '', current_status: '', experience_years: 0, job_alerts_enabled: false });
      setEditing(false); setMessage('Profile saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save profile.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="bg-base-100 border border-base-300 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center"><UserRound className="w-7 h-7" /></div>
          <div className="flex-1"><h2 className="text-xl font-bold">Recruiter profile</h2><p className="text-sm text-base-content/60">Your recruiter account details</p></div>
          <button type="button" onClick={() => setEditing(value => !value)} className="btn btn-outline btn-sm gap-2"><Edit3 className="w-4 h-4" />{editing ? 'Cancel' : 'Edit'}</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl bg-base-200 p-4"><p className="text-base-content/50 mb-1">Name</p>{editing ? <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="input input-bordered input-sm w-full" /> : <p className="font-medium">{profile.name}</p>}</div>
          <div className="rounded-xl bg-base-200 p-4"><p className="text-base-content/50 mb-1 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email</p><p className="font-medium break-all">{userEmail}</p></div>
          <div className="rounded-xl bg-base-200 p-4"><p className="text-base-content/50 mb-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location</p>{editing ? <input value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} className="input input-bordered input-sm w-full" /> : <p className="font-medium">{profile.location || 'Not specified'}</p>}</div>
          <div className="rounded-xl bg-base-200 p-4"><p className="text-base-content/50 mb-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</p>{editing ? <input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="input input-bordered input-sm w-full" /> : <p className="font-medium">{profile.phone || 'Not specified'}</p>}</div>
        </div>
        {editing && <div className="mt-5 flex justify-end"><button type="button" disabled={saving || !profile.name.trim()} onClick={save} className="btn btn-primary btn-sm gap-2"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save profile'}</button></div>}
        {message && <p className={`mt-4 text-sm ${message === 'Profile saved.' ? 'text-success' : 'text-error'}`}>{message}</p>}
      </div>

      <div className="bg-error/5 border border-error/20 rounded-2xl p-6">
        <div className="flex items-start gap-3"><Building2 className="w-5 h-5 text-error mt-0.5" /><div><h3 className="font-bold">Danger zone</h3><p className="text-sm text-base-content/70 mt-1 mb-4">Deleting your recruiter account permanently removes its job posts and associated applications.</p><DeleteAccountButton accountType="recruiter" onDeleted={onAccountDeleted} /></div></div>
      </div>
    </div>
  );
}
