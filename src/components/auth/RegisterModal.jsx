/** Register agent modal — collects all fields needed to list and run an agent. */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { getCategories, registerAgent } from '../../api/agentsApi.js';
import { startTestRun } from '../../api/runsApi.js';
import { useImageValidation } from '../../hooks/useImageValidation.js';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';
import { GhostBtn } from '../ui/GhostBtn.jsx';
import { AgentCardPreview } from '../browse/AgentCardPreview.jsx';
import { MiniTerminal } from '../session/MiniTerminal.jsx';

const STEPS = ['Basic info', 'Docker config', 'Tags & style', 'README'];

const INPUT_TYPES  = ['text', 'file', 'URL', 'JSON', 'image', 'audio'];
const OUTPUT_TYPES = ['text', 'report', 'code', 'image', 'JSON', 'chart'];

function Field({ label, hint, children }) {
  return (
    <div className="reg-field">
      <label className="reg-label">{label}{hint && <span className="reg-hint">{hint}</span>}</label>
      {children}
    </div>
  );
}

function formatPulls(n) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function ValidationBadge({ state }) {
  if (!state) return null;
  if (state === 'checking') {
    return <div className="img-validation img-validation--checking">Checking Docker Hub…</div>;
  }
  if (state.custom) {
    return <div className="img-validation img-validation--custom">Custom registry — will be verified at runtime</div>;
  }
  if (state.valid === false) {
    return <div className="img-validation img-validation--error">{state.error}</div>;
  }
  if (state.valid) {
    const pulls = formatPulls(state.pullCount);
    const updated = timeAgo(state.lastUpdated);
    return (
      <div className="img-validation img-validation--ok">
        <span className="img-val-check">✓</span>
        <span>Found on Docker Hub{state.isOfficial ? ' · Official image' : ''}</span>
        {pulls && <span className="img-val-stat">{pulls} pulls</span>}
        {updated && <span className="img-val-stat">Updated {updated}</span>}
      </div>
    );
  }
  return null;
}

export function RegisterModal() {
  const { registerOpen, setRegisterOpen } = useAuth();
  const { show } = useToast();
  const nav = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [testSessionId, setTestSessionId] = useState(null);
  const [testing, setTesting] = useState(false);

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
  const [envVars, setEnvVars]         = useState([]); // [{ key, desc, required }]
  const [inputs, setInputs]           = useState([]);
  const [outputs, setOutputs]         = useState([]);

  const { validationState, validate, resetValidation } = useImageValidation();

  useEffect(() => {
    if (registerOpen) getCategories().then((c) => setCategories(c.filter((x) => x !== 'All')));
  }, [registerOpen]);

  const onTestStopped = useCallback(() => {
    setTesting(false);
  }, []);

  if (!registerOpen) return null;

  const close = () => {
    setRegisterOpen(false);
    setStep(0); setTestSessionId(null); setTesting(false);
    setName(''); setAuthor(''); setDesc(''); setCategory('');
    setDockerImage(''); setDockerPort(''); setEmbed(false);
    setCaps(''); setModels(''); setColor('#6366f1'); setReadme('');
    setEnvVars([]); setInputs([]); setOutputs([]);
    resetValidation();
  };

  const onReadmeFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setReadme(text);
      if (!name && text.startsWith('# ')) setName(text.split('\n')[0].replace(/^#\s*/, '').trim());
    });
  };

  const onDockerImageBlur = () => validate(dockerImage);

  const onDockerImageChange = (e) => {
    setDockerImage(e.target.value);
    resetValidation();
    setTestSessionId(null);
  };

  const tryIt = async () => {
    setTesting(true);
    try {
      const { sessionId } = await startTestRun({ dockerImage, dockerPort: dockerPort || null, embed });
      setTestSessionId(sessionId);
    } catch (err) {
      show(err.message, 'error');
      setTesting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return name.trim() && desc.trim() && category;
    if (step === 1) return dockerImage.trim();
    if (step === 2) return true;
    if (step === 3) return readme.trim();
    return false;
  };

  const next = () => { if (canNext()) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const submit = async () => {
    if (!readme.trim()) { show('README is required', 'info'); return; }
    setSubmitting(true);
    try {
      const agent = await registerAgent({ name, author, desc, category, dockerImage, dockerPort: dockerPort || null, embed, caps, models, color, readme, envVars, inputs, outputs });
      show(`"${agent.name}" registered successfully!`, 'success');
      close();
      nav(`/library/${agent.slug}`);
    } catch (err) {
      show(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const parseTags = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);
  const showTerminal   = step === 1 && testSessionId;
  const showValidation = step === 1 && !testSessionId;
  const showReadme     = step === 3;

  return (
    <div className="modal-backdrop">
      <div className="modal modal-register">
        <div className="modal-header">
          <h2 className="modal-title">Register an agent</h2>
          <button className="modal-close" onClick={close} aria-label="Close">✕</button>
        </div>

        <div className="reg-layout">
          {/* Left — form */}
          <div className="reg-left">
            <div className="reg-steps">
              {STEPS.map((s, i) => (
                <div key={s} className={`reg-step ${i === step ? 'reg-step--active' : ''} ${i < step ? 'reg-step--done' : ''}`}>
                  <span className="reg-step-num">{i < step ? '✓' : i + 1}</span>
                  <span className="reg-step-label">{s}</span>
                </div>
              ))}
            </div>

            <div className="modal-body">
              {step === 0 && (
                <>
                  <Field label="Agent name" hint="required">
                    <input className="input" placeholder="e.g. my-research-agent" value={name} onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Author / org">
                    <input className="input" placeholder="e.g. your-username" value={author} onChange={(e) => setAuthor(e.target.value)} />
                  </Field>
                  <Field label="Description" hint="required">
                    <textarea className="input textarea" rows={3} placeholder="What does this agent do?" value={desc} onChange={(e) => setDesc(e.target.value)} />
                  </Field>
                  <Field label="Category" hint="required">
                    <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="">Select a category…</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </>
              )}

              {step === 1 && (
                <>
                  <Field label="Docker image" hint="required">
                    <input
                      className="input"
                      placeholder="e.g. myuser/my-agent:latest"
                      value={dockerImage}
                      onChange={onDockerImageChange}
                      onBlur={onDockerImageBlur}
                    />
                  </Field>
                  <Field label="Exposed port" hint="optional — only if the agent serves a web UI">
                    <input className="input" type="number" placeholder="e.g. 8501" value={dockerPort} onChange={(e) => setDockerPort(e.target.value)} />
                  </Field>
                  <Field label="Embed UI in session">
                    <label className="reg-checkbox">
                      <input type="checkbox" checked={embed} onChange={(e) => setEmbed(e.target.checked)} disabled={!dockerPort} />
                      <span>Show the agent's web UI in an iframe (requires a port)</span>
                    </label>
                  </Field>
                  <div className="reg-try-row">
                    <GhostBtn onClick={tryIt} disabled={!dockerImage.trim() || testing}>
                      {testing ? 'Running…' : 'Try it'}
                    </GhostBtn>
                    <span className="reg-hint">Spin up the container and see real logs</span>
                  </div>

                  <div className="reg-section-label">Environment variables<span className="reg-hint"> — API keys and secrets the agent needs at runtime</span></div>
                  {envVars.map((v, i) => (
                    <div key={i} className="envvar-row">
                      <input className="envvar-key" placeholder="KEY_NAME" value={v.key} onChange={(e) => setEnvVars(ev => ev.map((r, j) => j === i ? { ...r, key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_') } : r))} />
                      <input className="envvar-desc" placeholder="Description" value={v.desc} onChange={(e) => setEnvVars(ev => ev.map((r, j) => j === i ? { ...r, desc: e.target.value } : r))} />
                      <label className="envvar-required">
                        <input type="checkbox" checked={v.required} onChange={(e) => setEnvVars(ev => ev.map((r, j) => j === i ? { ...r, required: e.target.checked } : r))} />
                        req
                      </label>
                      <button className="envvar-remove" onClick={() => setEnvVars(ev => ev.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                  <button className="envvar-add" onClick={() => setEnvVars(ev => [...ev, { key: '', desc: '', required: false }])}>+ Add variable</button>
                </>
              )}

              {step === 2 && (
                <>
                  <Field label="Input types" hint="what the agent accepts">
                    <div className="io-toggle-group">
                      {INPUT_TYPES.map((t) => (
                        <button key={t} className={`io-toggle${inputs.includes(t) ? ' io-toggle--on' : ''}`} onClick={() => setInputs(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t])}>{t}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Output types" hint="what the agent produces">
                    <div className="io-toggle-group">
                      {OUTPUT_TYPES.map((t) => (
                        <button key={t} className={`io-toggle${outputs.includes(t) ? ' io-toggle--on' : ''}`} onClick={() => setOutputs(v => v.includes(t) ? v.filter(x => x !== t) : [...v, t])}>{t}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Capabilities" hint="comma-separated, e.g. web-search, tools, RAG">
                    <input className="input" placeholder="web-search, long-form, tools" value={caps} onChange={(e) => setCaps(e.target.value)} />
                  </Field>
                  <Field label="Models" hint="comma-separated, e.g. GPT-4o, Claude">
                    <input className="input" placeholder="GPT-4o, Claude" value={models} onChange={(e) => setModels(e.target.value)} />
                  </Field>
                  <Field label="Avatar color">
                    <div className="reg-color-row">
                      <input type="color" className="reg-color-input" value={color} onChange={(e) => setColor(e.target.value)} />
                      <span className="reg-color-preview" style={{ background: color }} />
                      <span className="reg-hint">{color}</span>
                    </div>
                  </Field>
                </>
              )}

              {step === 3 && (
                <Field label="README.md" hint="required — becomes the agent's Library page">
                  <label className="register-readme-label">
                    Upload file
                    <input type="file" accept=".md,.markdown,text/markdown" onChange={onReadmeFile} className="register-readme-file" />
                  </label>
                  <textarea
                    className="input textarea register-readme"
                    placeholder="Or paste README.md content here…"
                    rows={10}
                    value={readme}
                    onChange={(e) => setReadme(e.target.value)}
                  />
                </Field>
              )}
            </div>

            <div className="modal-footer reg-footer">
              {step > 0 && <GhostBtn onClick={back}>Back</GhostBtn>}
              {step < STEPS.length - 1 && (
                <PrimaryBtn onClick={next} disabled={!canNext()}>Next</PrimaryBtn>
              )}
              {step === STEPS.length - 1 && (
                <PrimaryBtn onClick={submit} disabled={submitting || !readme.trim()}>
                  {submitting ? 'Registering…' : 'Submit agent'}
                </PrimaryBtn>
              )}
            </div>
          </div>

          {/* Right — context-aware panel */}
          <div className="reg-right">
            {showTerminal ? (
              <MiniTerminal sessionId={testSessionId} onStopped={onTestStopped} />
            ) : showReadme ? (
              <div className="readme-preview-panel">
                <p className="card-preview-label">README preview</p>
                <div className="readme-preview-body markdown-body">
                  {readme
                    ? <Markdown>{readme}</Markdown>
                    : <p className="reg-validation-hint">Start typing or upload a README to see the preview.</p>}
                </div>
              </div>
            ) : (
              <>
                {showValidation && (
                  <div className="reg-validation-panel">
                    <p className="card-preview-label">Image validation</p>
                    <ValidationBadge state={validationState} />
                    {!validationState && (
                      <p className="reg-validation-hint">Tab out of the image field to validate against Docker Hub</p>
                    )}
                  </div>
                )}
                <AgentCardPreview
                  name={name}
                  author={author}
                  desc={desc}
                  caps={parseTags(caps)}
                  models={parseTags(models)}
                  color={color}
                  inputs={inputs}
                  outputs={outputs}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
