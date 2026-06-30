/** Environment setup — local dev and optional embedded agents. */
import { usePageTitle } from '../hooks/usePageTitle.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';

const STEPS = [
  {
    title: 'Clone and install',
    body: 'Get the repo running locally with Node.js 18+ and npm 9+.',
    code: 'git clone https://github.com/veeraiahMadamanchi7777/agenthub.git\ncd agenthub\nnpm install\nnpm run dev',
  },
  {
    title: 'Open the app',
    body: 'The dev server starts on port 5173 by default.',
    code: 'open http://localhost:5173',
  },
  {
    title: 'Embedded agents (optional)',
    body: 'Some agents (e.g. financial-advisor) load a local iframe. Run the agent container before opening a session.',
    code: 'docker build -t financial-ai-agent:local .\ndocker run -p 8501:8501 --env-file .env financial-ai-agent:local',
  },
];

export function SetupPage() {
  usePageTitle('Workstation');

  return (
    <main className="page page-narrow setup-page">
      <PageHeader
        title="Workstation"
        subtitle="Local environment checklist for running AgentHub and embedded agents."
      />

      <ol className="setup-steps">
        {STEPS.map((step, i) => (
          <li key={step.title} className="setup-step">
            <div className="setup-step-head">
              <span className="setup-step-num">{i + 1}</span>
              <h2 className="setup-step-title">{step.title}</h2>
            </div>
            <p className="setup-step-body">{step.body}</p>
            <pre className="setup-code"><code>{step.code}</code></pre>
          </li>
        ))}
      </ol>

      <section className="setup-env" aria-labelledby="setup-env-title">
        <h2 id="setup-env-title" className="setup-env-title">Environment variables</h2>
        <p className="setup-env-desc">
          Copy <code className="setup-inline-code">.cursor/whatsapp.env.example</code> to configure optional WhatsApp notifications.
          Embedded agents use their own <code className="setup-inline-code">.env</code> from the agent repository.
        </p>
      </section>
    </main>
  );
}
