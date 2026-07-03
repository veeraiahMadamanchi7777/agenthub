/** Edit agent modal — pre-filled single-form with live card preview and delete. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { getCategories, updateAgent, deleteAgent } from '../../api/agentsApi.js';
import { useImageValidation } from '../../hooks/useImageValidation.js';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';
import { GhostBtn } from '../ui/GhostBtn.jsx';
import { AgentCardPreview } from '../browse/AgentCardPreview.jsx';

function Field({ label, hint, children }) {
  return (
    <div className="reg-field">
      <label className="reg-label">{label}{hint && <span className="reg-hint">{hint}</span>}</label>
      {children}
    </div>
  );
}

export function EditAgentModal() {
  const { editAgent, setEditAgent } = useAuth();
  const { show } = useToast();
  const nav = useNavigate();

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState([]);

  const [name, setName]               = useState('');
  const [author, setAuthor]           = useState('');
  const [desc, setDesc]               = useState('');
  const [category, setCategory]       = useState('');
  const [dockerImage, setDockerImage] = useState('');
  const [dockerPort, setDockerPort]   = useState('');
  const [embed, setEmbed]             = useState(false);
  const [caps, setCaps]               = useState('');
  const [models, setModels]           = useState('');
  const [color, setColor]             = useState('#6366f1');
  const [readme, setReadme]           = useState('');

  const { validationState, validate, resetValidation } = useImageValidation();

  // Pre-fill when agent changes
  useEffect(() => {
    if (!editAgent) return;
    setName(editAgent.name || '');
    setAuthor(editAgent.author || '');
    setDesc(editAgent.desc || '');
    setCategory(editAgent.category || '');
    setDockerImage(editAgent.dockerImage || '');
    setDockerPort(editAgent.containerPort ? String(editAgent.containerPort) : '');
    setEmbed(editAgent.kind === 'embedded');
    setCaps((editAgent.caps || []).join(', '));
    setModels((editAgent.models || []).join(', '));
    setColor(editAgent.color || '#6366f1');
    setReadme('');
    resetValidation();
    setConfirmDelete(false);
  }, [editAgent, resetValidation]);

  useEffect(() => {
    if (editAgent) getCategories().then((c) => setCategories(c.filter((x) => x !== 'All')));
  }, [editAgent]);

  // Load existing README into the textarea
  useEffect(() => {
    if (!editAgent) return;
    fetch(`/readmes/${editAgent.slug}/README.md`)
      .then((r) => r.ok ? r.text() : '')
      .then((text) => setReadme(text))
      .catch(() => {});
  }, [editAgent]);

  if (!editAgent) return null;

  const close = () => { setEditAgent(null); setConfirmDelete(false); };

  const parseTags = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);

  const save = async () => {
    if (!name.trim() || !desc.trim() || !category) {
      show('Name, description and category are required', 'info'); return;
    }
    setSaving(true);
    try {
      await updateAgent(editAgent.slug, {
        name, author, desc, category, dockerImage,
        dockerPort: dockerPort || null, embed, caps, models, color,
        readme: readme || undefined,
      });
      show(`"${name}" updated`, 'success');
      close();
      // Force a fresh load of the agent page
      nav(0);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmAndDelete = async () => {
    setDeleting(true);
    try {
      await deleteAgent(editAgent.slug);
      show(`"${editAgent.name}" deleted`, 'success');
      close();
      nav('/');
    } catch (err) {
      show(err.message, 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const onReadmeFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setReadme);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal modal-register">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Edit agent</h2>
            <span className="edit-modal-slug">{editAgent.slug}</span>
          </div>
          <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="reg-layout">
          {/* Left — form */}
          <div className="reg-left">
            <div className="modal-body">
              <Field label="Display name" hint="required">
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Author / org">
                <input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} />
              </Field>
              <Field label="Description" hint="required">
                <textarea className="input textarea" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </Field>
              <Field label="Category" hint="required">
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select a category…</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <div className="edit-section-divider">Docker</div>

              <Field label="Docker image">
                <input
                  className="input"
                  placeholder="e.g. myuser/my-agent:latest"
                  value={dockerImage}
                  onChange={(e) => { setDockerImage(e.target.value); resetValidation(); }}
                  onBlur={() => validate(dockerImage)}
                />
                {validationState && validationState !== 'checking' && (
                  <p className={`edit-val-badge edit-val-badge--${validationState.valid ? 'ok' : validationState.custom ? 'custom' : 'err'}`}>
                    {validationState.valid
                      ? `✓ Found on Docker Hub${validationState.isOfficial ? ' · Official' : ''}`
                      : validationState.custom
                        ? 'Custom registry — verified at runtime'
                        : validationState.error}
                  </p>
                )}
                {validationState === 'checking' && <p className="edit-val-badge">Checking…</p>}
              </Field>
              <Field label="Exposed port" hint="optional">
                <input className="input" type="number" placeholder="e.g. 8501" value={dockerPort} onChange={(e) => setDockerPort(e.target.value)} />
              </Field>
              <Field label="Embed UI in session">
                <label className="reg-checkbox">
                  <input type="checkbox" checked={embed} onChange={(e) => setEmbed(e.target.checked)} disabled={!dockerPort} />
                  <span>Show agent's web UI in an iframe (requires a port)</span>
                </label>
              </Field>

              <div className="edit-section-divider">Tags & style</div>

              <Field label="Capabilities" hint="comma-separated">
                <input className="input" placeholder="web-search, tools, RAG" value={caps} onChange={(e) => setCaps(e.target.value)} />
              </Field>
              <Field label="Models" hint="comma-separated">
                <input className="input" placeholder="GPT-4o, Claude" value={models} onChange={(e) => setModels(e.target.value)} />
              </Field>
              <Field label="Avatar color">
                <div className="reg-color-row">
                  <input type="color" className="reg-color-input" value={color} onChange={(e) => setColor(e.target.value)} />
                  <span className="reg-color-preview" style={{ background: color }} />
                  <span className="reg-hint">{color}</span>
                </div>
              </Field>

              <div className="edit-section-divider">README</div>

              <Field label="README.md" hint="leave empty to keep existing">
                <label className="register-readme-label">
                  Upload file
                  <input type="file" accept=".md,.markdown,text/markdown" onChange={onReadmeFile} className="register-readme-file" />
                </label>
                <textarea
                  className="input textarea register-readme"
                  placeholder="Paste updated README.md…"
                  rows={8}
                  value={readme}
                  onChange={(e) => setReadme(e.target.value)}
                />
              </Field>
            </div>

            <div className="modal-footer edit-footer">
              {!confirmDelete ? (
                <>
                  <GhostBtn onClick={() => setConfirmDelete(true)} className="edit-delete-btn">Delete agent</GhostBtn>
                  <div className="edit-footer-right">
                    <GhostBtn onClick={close}>Cancel</GhostBtn>
                    <PrimaryBtn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</PrimaryBtn>
                  </div>
                </>
              ) : (
                <>
                  <span className="edit-confirm-text">Delete permanently? This cannot be undone.</span>
                  <div className="edit-footer-right">
                    <GhostBtn onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</GhostBtn>
                    <button className="btn-danger" onClick={confirmAndDelete} disabled={deleting}>
                      {deleting ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right — live preview */}
          <div className="reg-right">
            <AgentCardPreview
              name={name}
              author={author}
              desc={desc}
              caps={parseTags(caps)}
              models={parseTags(models)}
              color={color}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
