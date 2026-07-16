import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { useAgents } from '../hooks/useAgents.js';
import { useToast } from '../context/ToastProvider.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { apiUpdateProfile, apiChangePassword, apiDeleteAccount } from '../api/authApi.js';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';
import { AgentAvatar } from '../components/agents/AgentAvatar.jsx';

export function AccountPage() {
  const { user, signOut, updateUser, setEditAgent } = useAuth();
  const { agents } = useAgents();
  const { show } = useToast();
  const nav = useNavigate();
  usePageTitle('Account');

  const myAgents = agents.filter((a) => a.authorId === user?.id);

  // Profile form
  const [username, setUsername]     = useState(user?.username || '');
  const [bio, setBio]               = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#6366f1');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [savingPw, setSavingPw]     = useState(false);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  if (!user) {
    nav('/');
    return null;
  }

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { user: updated } = await apiUpdateProfile({ username, bio, avatar_color: avatarColor });
      updateUser(updated);
      show('Profile updated', 'success');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setSavingPw(true);
    try {
      await apiChangePassword({ currentPassword: currentPw, newPassword: newPw });
      show('Password changed', 'success');
      setCurrentPw(''); setNewPw('');
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await apiDeleteAccount();
      signOut();
      show('Account deleted', 'success');
      nav('/');
    } catch (err) {
      show(err.message, 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <main className="page account-page">
      <h1 className="page-title">Account</h1>

      {/* ── Profile ── */}
      <section className="account-section">
        <h2 className="account-section-title">Profile</h2>
        <div className="account-profile-row">
          <div className="account-avatar" style={{ background: avatarColor }}>
            {username[0]?.toUpperCase() || '?'}
          </div>
          <div className="account-profile-fields">
            <label className="reg-label">Username</label>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
            <label className="reg-label" style={{ marginTop: 10 }}>Bio</label>
            <textarea className="input textarea" rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio…" />
            <label className="reg-label" style={{ marginTop: 10 }}>Avatar color</label>
            <div className="reg-color-row">
              <input type="color" className="reg-color-input" value={avatarColor} onChange={(e) => setAvatarColor(e.target.value)} />
              <span className="reg-color-preview" style={{ background: avatarColor }} />
              <span className="reg-hint">{avatarColor}</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <PrimaryBtn onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save profile'}
              </PrimaryBtn>
            </div>
          </div>
        </div>
        <div className="account-meta">
          <span className="muted">Email: {user.email || '—'}</span>
          {user.github_username && <span className="muted">GitHub: {user.github_username}</span>}
        </div>
      </section>

      {/* ── My agents ── */}
      <section className="account-section">
        <h2 className="account-section-title">My agents</h2>
        {myAgents.length === 0 ? (
          <p className="muted">You haven't registered any agents yet.</p>
        ) : (
          <div className="account-agents-list">
            {myAgents.map((a) => (
              <div key={a.slug} className="account-agent-row">
                <AgentAvatar agent={a} size={36} />
                <div className="account-agent-info">
                  <span className="account-agent-name">{a.name}</span>
                  <span className="muted account-agent-slug">/{a.slug}</span>
                </div>
                <div className="account-agent-actions">
                  <GhostBtn onClick={() => nav(`/agents/${a.slug}`)}>View</GhostBtn>
                  <GhostBtn onClick={() => setEditAgent(a)}>Edit</GhostBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Change password ── */}
      {user.password_hash !== undefined && (
        <section className="account-section">
          <h2 className="account-section-title">Change password</h2>
          <div className="account-pw-form">
            <input className="input" type="password" placeholder="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
            <input className="input" type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
            <PrimaryBtn onClick={savePassword} disabled={savingPw || !currentPw || newPw.length < 8}>
              {savingPw ? 'Updating…' : 'Update password'}
            </PrimaryBtn>
          </div>
        </section>
      )}

      {/* ── Danger zone ── */}
      <section className="account-section account-danger">
        <h2 className="account-section-title account-danger-title">Danger zone</h2>
        {!confirmDelete ? (
          <GhostBtn onClick={() => setConfirmDelete(true)} className="edit-delete-btn">Delete account</GhostBtn>
        ) : (
          <div className="account-delete-confirm">
            <p className="account-delete-warn">This will permanently delete your account and cannot be undone.</p>
            <div className="flex-row">
              <button className="btn-danger" onClick={deleteAccount} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete my account'}
              </button>
              <GhostBtn onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</GhostBtn>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
