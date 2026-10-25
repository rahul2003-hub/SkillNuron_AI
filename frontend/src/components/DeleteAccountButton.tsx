import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { deleteMyAccount } from '../services/api';

interface DeleteAccountButtonProps {
  accountType: 'jobseeker' | 'recruiter';
  onDeleted: () => void;
}

export function DeleteAccountButton({ accountType, onDeleted }: DeleteAccountButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const recruiterWarning = accountType === 'recruiter'
    ? 'Your job posts and all applications submitted to them will also be permanently deleted.'
    : 'Your profile, skills, resumés, applications, and job-alert settings will be permanently deleted.';

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteMyAccount();
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.');
      setIsDeleting(false);
    }
  };

  return <>
    <button type="button" onClick={() => setOpen(true)} className="btn btn-error btn-outline btn-sm gap-2">
      <Trash2 className="w-4 h-4" /> Delete account
    </button>
    {open && <div className="modal modal-open" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
      <div className="modal-box">
        <AlertTriangle className="w-10 h-10 text-error mb-4" />
        <h2 id="delete-account-title" className="text-xl font-bold">Delete account permanently?</h2>
        <p className="mt-3 text-sm text-base-content/70">This cannot be undone. {recruiterWarning}</p>
        <label className="form-control mt-5">
          <span className="label-text mb-2">Type <strong>DELETE</strong> to confirm</span>
          <input autoFocus value={confirmation} onChange={event => setConfirmation(event.target.value)} className="input input-bordered" placeholder="DELETE" />
        </label>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
        <div className="modal-action">
          <button type="button" className="btn btn-ghost" disabled={isDeleting} onClick={() => setOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-error" disabled={confirmation !== 'DELETE' || isDeleting} onClick={handleDelete}>
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />} Permanently delete
          </button>
        </div>
      </div>
    </div>}
  </>;
}
