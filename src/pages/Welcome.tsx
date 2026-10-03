import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogoMark, Wordmark } from '../components/Logo';
import { useApp } from '../context/AppState';
import { PERSONA_SHORTCUTS } from '../data/personas';

export default function Welcome() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-6 flex w-fit items-center gap-3">
          <LogoMark size={52} />
          <Wordmark className="text-3xl" />
        </div>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Meet other apprentices.
          <br />
          <span className="text-accent">Close your KSB gaps.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-gray-600">
          Socials and workshops just for UK apprentices. Tell us your standard and we'll find the events that fill your gaps, then
          write up the evidence for you.
        </p>

        <button type="button" onClick={() => navigate('/onboarding')} className="btn-primary mt-8 w-full py-3.5 text-lg">
          Get started <ArrowRight className="size-5" />
        </button>
        <p className="mt-2 text-sm text-gray-500">Free to use. Apprentices only.</p>

        <div className="mt-12 rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Demo shortcuts</p>
          <div className="space-y-2">
            {PERSONA_SHORTCUTS.map((p) => (
              <button
                key={p.userId}
                type="button"
                onClick={() => {
                  dispatch({ type: 'login', userId: p.userId });
                  navigate('/');
                }}
                className="flex w-full items-center justify-between rounded-xl border border-line px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-accent hover:bg-accent-soft/40"
              >
                {p.label}
                <ArrowRight className="size-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
