import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider.jsx';
import { useToast } from '../context/ToastProvider.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { apiUpdateProfile, apiChangePassword, apiDeleteAccount } from '../api/authApi.js';
import { PrimaryBtn } from '../components/ui/PrimaryBtn.jsx';
import { GhostBtn } from '../components/ui/GhostBtn.jsx';

const PRESET_ICONS = ['🤖','🦾','🧠','🔮','⚡','🚀','💡','🎯','🔬','🧬','💻','🌐','🎨','🦊','🐙','🦋','🔥','🌟','🎭','🦄'];
const PRESET_COLORS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#eab308','#22c55e','#14b8a6','#0ea5e9','#64748b'];

function Avatar({ user, avatarData, avatarColor, size = 80 }) {
  const initial = (user.name || user.username || '?')[0].toUpperCase();
  const fontSize = size * 0.38;

  if (avatarData?.startsWith('data:')) {
    return <img src={avatarData} alt={user.username} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  if (avatarData?.startsWith('emoji:')) {
    const emoji = avatarData.slice(6);
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fontSize * 1.3, flexShrink: 0 }}>
        {emoji}
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: avatarColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700, flexShrink: 0 }}>
      {initial}
    </div>
  );
}

function AvatarPicker({ avatarData, setAvatarData, avatarColor, setAvatarColor }) {
  const [tab, setTab] = useState('icons');
  const fileRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      // Compress via canvas to max 200x200
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setAvatarData(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="avatar-picker">
      <div className="avatar-picker-tabs">
        <button className={`avatar-picker-tab${tab === 'icons' ? ' avatar-picker-tab--active' : ''}`} onClick={() => setTab('icons')}>Icons</button>
        <button className={`avatar-picker-tab${tab === 'photo' ? ' avatar-picker-tab--active' : ''}`} onClick={() => setTab('photo')}>Photo</button>
        <button className={`avatar-picker-tab${tab === 'color' ? ' avatar-picker-tab--active' : ''}`} onClick={() => setTab('color')}>Color</button>
      </div>

      {tab === 'icons' && (
        <div className="avatar-picker-icons">
          {PRESET_ICONS.map((icon) => (
            <button
              key={icon}
              className={`avatar-icon-btn${avatarData === `emoji:${icon}` ? ' avatar-icon-btn--active' : ''}`}
              onClick={() => setAvatarData(`emoji:${icon}`)}
            >
              {icon}
            </button>
          ))}
        </div>
      )}

      {tab === 'photo' && (
        <div className="avatar-picker-photo">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          <button className="avatar-upload-btn" onClick={() => fileRef.current?.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
            Upload photo
          </button>
          <p className="avatar-upload-hint">JPG, PNG or GIF · Max 5MB · Resized to 200×200</p>
          {avatarData?.startsWith('data:') && (
            <button className="avatar-remove-btn" onClick={() => setAvatarData('')}>Remove photo</button>
          )}
        </div>
      )}

      {tab === 'color' && (
        <div className="avatar-picker-color">
          <div className="avatar-color-swatches">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                className={`avatar-color-swatch${avatarColor === c ? ' avatar-color-swatch--active' : ''}`}
                style={{ background: c }}
                onClick={() => { setAvatarColor(c); if (!avatarData || avatarData.startsWith('emoji:')) setAvatarData(''); }}
              />
            ))}
          </div>
          <div className="reg-color-row" style={{ marginTop: 10 }}>
            <input type="color" className="reg-color-input" value={avatarColor} onChange={(e) => { setAvatarColor(e.target.value); if (!avatarData || avatarData.startsWith('emoji:')) setAvatarData(''); }} />
            <span className="reg-color-preview" style={{ background: avatarColor }} />
            <span className="reg-hint">{avatarColor}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function AccountPage() {
  const { user, signOut, updateUser } = useAuth();
  const { show } = useToast();
  const nav = useNavigate();
  usePageTitle('Profile');

  const [name, setName]               = useState(user?.name || '');
  const [username, setUsername]       = useState(user?.username || '');
  const [bio, setBio]                 = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatar_color || '#6366f1');
  const [avatarData, setAvatarData]   = useState(user?.avatar_data || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [showPwForm, setShowPwForm]   = useState(false);
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw, setNewPw]             = useState('');
  const [savingPw, setSavingPw]       = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]       = useState(false);

  if (!user) { nav('/'); return null; }

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { user: updated } = await apiUpdateProfile({ name, username, bio, avatar_color: avatarColor, avatar_data: avatarData });
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
      setCurrentPw(''); setNewPw(''); setShowPwForm(false);
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
      <h1 className="page-title">Profile</h1>

      {/* ── Profile card ── */}
      <section className="account-section">
        <div className="profile-top">
          <div className="profile-avatar-col">
            <Avatar user={user} avatarData={avatarData} avatarColor={avatarColor} size={88} />
            <p className="profile-avatar-name">{name || username}</p>
            <p className="profile-avatar-handle">@{username}</p>
          </div>
          <div className="profile-fields-col">
            <div className="profile-row-2">
              <div className="reg-field">
                <label className="reg-label">Name</label>
                <input className="input" placeholder="Your display name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="reg-field">
                <label className="reg-label">Username</label>
                <input className="input" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>
            <div className="reg-field">
              <label className="reg-label">Bio</label>
              <textarea className="input textarea" rows={2} placeholder="A short bio…" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="profile-meta">
              <span className="profile-meta-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg>
                {user.email || '—'}
              </span>
              {user.github_username && (
                <span className="profile-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"/></svg>
                  {user.github_username}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Avatar picker ── */}
        <div className="profile-avatar-section">
          <p className="reg-label" style={{ marginBottom: 8 }}>Profile picture</p>
          <AvatarPicker
            avatarData={avatarData}
            setAvatarData={setAvatarData}
            avatarColor={avatarColor}
            setAvatarColor={setAvatarColor}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <PrimaryBtn onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </PrimaryBtn>
        </div>
      </section>

      {/* ── Password ── */}
      {!user.github_id || user.password_hash !== undefined ? (
        <section className="account-section">
          <div className="account-pw-header">
            <h2 className="account-section-title" style={{ margin: 0 }}>Password</h2>
            {!showPwForm && (
              <GhostBtn onClick={() => setShowPwForm(true)}>Change password</GhostBtn>
            )}
          </div>
          {showPwForm && (
            <div className="account-pw-form" style={{ marginTop: 16 }}>
              <input className="input" type="password" placeholder="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
              <input className="input" type="password" placeholder="New password (min 8 chars)" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" />
              <div className="flex-row">
                <PrimaryBtn onClick={savePassword} disabled={savingPw || !currentPw || newPw.length < 8}>
                  {savingPw ? 'Updating…' : 'Update password'}
                </PrimaryBtn>
                <GhostBtn onClick={() => { setShowPwForm(false); setCurrentPw(''); setNewPw(''); }}>Cancel</GhostBtn>
              </div>
            </div>
          )}
        </section>
      ) : null}

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
