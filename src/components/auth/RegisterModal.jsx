/** Register agent modal — README file is the docs source. */
import { useState } from 'react';
import { useAuth } from '../../context/AuthProvider.jsx';
import { useToast } from '../../context/ToastProvider.jsx';
import { extractReadmeSummary } from '../../utils/readme.js';
import { PrimaryBtn } from '../ui/PrimaryBtn.jsx';

export function RegisterModal() {
  const { registerOpen, setRegisterOpen } = useAuth();
  const { show } = useToast();
  const [name, setName] = useState('');
  const [repo, setRepo] = useState('');
  const [readme, setReadme] = useState('');

  if (!registerOpen) return null;

  const onReadmeFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((text) => {
      setReadme(text);
      if (!name && text.startsWith('# ')) {
        setName(text.split('\n')[0].replace(/^#\s*/, '').trim());
      }
      show('README loaded — this will become the agent wiki page', 'success');
    });
  };

  const submit = () => {
    if (!name.trim()) { show('Agent name is required', 'info'); return; }
    if (!readme.trim()) { show('Upload a README.md — it becomes the wiki docs', 'info'); return; }
    setRegisterOpen(false);
    show(`"${name}" submitted. README preview: ${extractReadmeSummary(readme).slice(0, 80)}…`, 'success');
    setName(''); setRepo(''); setReadme('');
  };

  return (
    <div className="modal-backdrop">
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2 className="modal-title">Register an agent</h2>
          <button className="modal-close" onClick={() => setRegisterOpen(false)} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">
          <input className="input" placeholder="Agent name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="Repository URL" value={repo} onChange={(e) => setRepo(e.target.value)} />
          <label className="register-readme-label">
            README.md
            <input type="file" accept=".md,.markdown,text/markdown" onChange={onReadmeFile} className="register-readme-file" />
          </label>
          <textarea
            className="input textarea register-readme"
            placeholder="Paste README.md content — shown in the Library automatically"
            rows={8}
            value={readme}
            onChange={(e) => setReadme(e.target.value)}
          />
          <PrimaryBtn onClick={submit}>Submit for review</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}
