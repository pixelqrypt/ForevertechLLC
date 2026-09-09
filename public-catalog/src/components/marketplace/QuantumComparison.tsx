import { ArrowRight } from 'lucide-react';

const standardSteps = ['Write Prompt', 'Render Standard Asset', 'Preview On Product', 'Purchase'];
const quantumSteps = ['Write Prompt', 'Unlock Quantum Session', 'Render Verified Asset', 'Preview Premium Result', 'Purchase'];

function StepRow({ steps, arrowClassName }: { steps: string[]; arrowClassName: string }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2">
          <span>{step}</span>
          {index < steps.length - 1 ? <ArrowRight className={`h-4 w-4 ${arrowClassName}`} /> : null}
        </div>
      ))}
    </div>
  );
}

export function QuantumComparison() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-2xl font-semibold text-white">Standard Generation</h2>
        <p className="mt-2 text-sm text-zinc-400">Fast creation flow for baseline public storefront assets.</p>
        <StepRow steps={standardSteps} arrowClassName="text-zinc-500" />
      </div>
      <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
        <h2 className="text-2xl font-semibold text-white">Real Quantum Generation</h2>
        <p className="mt-2 text-sm text-purple-100/80">Paid, verified, premium generation with a stronger provenance story.</p>
        <StepRow steps={quantumSteps} arrowClassName="text-purple-300" />
      </div>
    </section>
  );
}
