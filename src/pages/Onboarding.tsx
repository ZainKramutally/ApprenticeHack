import { addMonths } from 'date-fns';
import { Check, ChevronLeft } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { VerifiedTick } from '../components/Badge';
import { Chip } from '../components/FilterChips';
import { LogoMark } from '../components/Logo';
import { useApp, useApprentice } from '../context/AppState';
import { getStandard, KSB_TYPE_LABEL, ksbsForPathway, STANDARDS } from '../data/standards';
import { isoDay } from '../lib/dates';
import { checkEmail } from '../lib/email';
import { CITIES } from '../lib/events';
import type { Apprentice, City, KsbType, OrganiserType, StandardCode } from '../types';

const ORG_TYPES: { id: OrganiserType; label: string }[] = [
  { id: 'employer', label: 'Employer' },
  { id: 'provider', label: 'Training provider' },
  { id: 'uni', label: 'University' },
  { id: 'apprentice', label: 'Apprentice-run group' },
];

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : hint ? <div className="mt-1">{hint}</div> : null}
    </label>
  );
}

export default function Onboarding() {
  const [params] = useSearchParams();
  const editing = params.get('edit') === 'baseline';
  const existing = useApprentice();
  if (editing && !existing) return <Navigate to="/profile" replace />;
  return <Wizard editing={editing} existing={editing ? existing : null} />;
}

function Wizard({ editing, existing }: { editing: boolean; existing: Apprentice | null }) {
  const { dispatch, toast } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(editing ? 3 : 1);
  const [tried, setTried] = useState(false);

  // Step 1: account
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [role, setRole] = useState<'apprentice' | 'organiser'>('apprentice');
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<OrganiserType>('employer');
  const [orgCity, setOrgCity] = useState<City>('London');

  // Step 2: apprenticeship
  const [standardCode, setStandardCode] = useState<StandardCode>(existing?.standardCode ?? 'ST0119');
  const [pathway, setPathway] = useState(existing?.pathway ?? getStandard('ST0119').pathways[0]);
  const [provider, setProvider] = useState(existing?.provider ?? '');
  const [employer, setEmployer] = useState(existing?.employer ?? '');
  const [city, setCity] = useState<City>(existing?.city ?? 'London');

  // Step 3: baseline
  const [otjTarget, setOtjTarget] = useState(existing?.otjTargetHours ?? getStandard('ST0119').minOtjHours);
  const [otjLogged, setOtjLogged] = useState(existing?.otjLoggedHours ?? 0);
  const [gateway, setGateway] = useState(existing?.gatewayDate ?? isoDay(addMonths(new Date(), 24)));
  const [signedOff, setSignedOff] = useState<string[]>(existing?.signedOff ?? []);
  const [focus, setFocus] = useState<string[]>(existing?.coachFocus ?? []);

  const emailCheck = checkEmail(email);
  const std = getStandard(standardCode);
  const ksbs = ksbsForPathway(standardCode, pathway);
  const totalSteps = role === 'organiser' ? 1 : 3;

  const step1Errors = {
    name: name.trim() ? undefined : 'Enter your name',
    email: emailCheck.ok ? undefined : emailCheck.error,
    dob: dob ? undefined : 'Enter your date of birth',
    orgName: role === 'organiser' && !orgName.trim() ? 'Enter your organisation name' : undefined,
  };
  const step2Errors = { provider: provider.trim() ? undefined : 'Enter your training provider' };
  const valid = (errs: Record<string, string | undefined>) => Object.values(errs).every((e) => !e);

  const changeStandard = (code: StandardCode) => {
    const s = getStandard(code);
    setStandardCode(code);
    setPathway(s.pathways[0]);
    setOtjTarget(s.minOtjHours);
    setSignedOff([]);
    setFocus([]);
  };

  const toggleSigned = (id: string) => {
    setSignedOff((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
    setFocus((xs) => xs.filter((x) => x !== id));
  };
  const toggleFocus = (id: string) =>
    setFocus((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : xs.length >= 3 ? xs : [...xs, id]));

  const next = () => {
    setTried(true);
    if (step === 1) {
      if (!valid(step1Errors)) return;
      if (role === 'organiser') return finishOrganiser();
      setTried(false);
      setStep(2);
    } else if (step === 2) {
      if (!valid(step2Errors)) return;
      setTried(false);
      setStep(3);
    } else {
      finishApprentice();
    }
  };

  const finishOrganiser = () => {
    const orgId = newId('org');
    dispatch({
      type: 'addUser',
      organiser: { id: orgId, name: orgName.trim(), type: orgType, cities: [orgCity] },
      user: { id: newId('u'), role: 'organiser', name: name.trim(), email: email.trim(), dob, organiserId: orgId },
    });
    toast(`Welcome, ${name.trim().split(' ')[0]}`);
    navigate('/');
  };

  const finishApprentice = () => {
    const ownIds = new Set(ksbs.map((k) => k.id));
    const baseline = {
      otjTargetHours: Math.max(0, Number(otjTarget) || 0),
      otjLoggedHours: Math.max(0, Number(otjLogged) || 0),
      gatewayDate: gateway,
      signedOff: signedOff.filter((id) => ownIds.has(id)),
      coachFocus: focus.filter((id) => ownIds.has(id)).slice(0, 3),
    };
    if (editing && existing) {
      dispatch({ type: 'updateUser', user: { ...existing, ...baseline } });
      toast('Baseline updated');
      navigate('/profile');
      return;
    }
    dispatch({
      type: 'addUser',
      user: {
        id: newId('u'),
        role: 'apprentice',
        name: name.trim(),
        email: email.trim(),
        dob,
        standardCode,
        pathway,
        provider: provider.trim(),
        employer: employer.trim() || undefined,
        city,
        ...baseline,
      },
    });
    toast(`Welcome, ${name.trim().split(' ')[0]}`);
    navigate('/');
  };

  const back = () => {
    if (editing) return navigate('/profile');
    if (step === 1) return navigate('/welcome');
    setStep(step - 1);
  };

  const stepTitle = step === 1 ? 'Your account' : step === 2 ? 'Your apprenticeship' : 'Your baseline';

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <button type="button" onClick={back} className="btn-ghost -ml-3">
            <ChevronLeft className="size-4" /> Back
          </button>
          <Link to="/welcome" aria-label="Off the Clock home">
            <LogoMark size={32} />
          </Link>
        </div>

        {!editing && (
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-sm font-semibold text-gray-500">
              <span>
                Step {step} of {totalSteps}
              </span>
              <span>{stepTitle}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-200">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>
        )}

        <form
          className="card space-y-5 p-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          <h1 className="text-2xl font-extrabold tracking-tight">{editing ? 'Edit your baseline' : stepTitle}</h1>

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-1 rounded-full bg-stone-100 p-1">
                {(['apprentice', 'organiser'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={role === r}
                    onClick={() => setRole(r)}
                    className={`rounded-full py-2 text-sm font-semibold capitalize ${role === r ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Field label="Full name" error={tried ? step1Errors.name : undefined}>
                <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </Field>
              <Field
                label="Email"
                error={tried || /@.+\..+/.test(email) ? step1Errors.email : undefined}
                hint={
                  emailCheck.ok ? (
                    emailCheck.verified ? (
                      <VerifiedTick verified />
                    ) : (
                      <span className="text-sm text-gray-500">Accepted. Provider, uni and known employer emails get a Verified tick.</span>
                    )
                  ) : (
                    <span className="text-sm text-gray-500">Use your training provider, uni or employer email.</span>
                  )
                }
              >
                <input
                  className="input w-full"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@yourprovider.ac.uk"
                />
              </Field>
              <Field label="Date of birth" error={tried ? step1Errors.dob : undefined}>
                <input className="input w-full" type="date" value={dob} max={isoDay(new Date())} onChange={(e) => setDob(e.target.value)} />
              </Field>
              {role === 'organiser' && (
                <>
                  <Field label="Organisation name" error={tried ? step1Errors.orgName : undefined}>
                    <input className="input w-full" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                  </Field>
                  <Field label="Organisation type">
                    <div className="flex flex-wrap gap-2">
                      {ORG_TYPES.map((t) => (
                        <Chip key={t.id} active={orgType === t.id} onClick={() => setOrgType(t.id)}>
                          {t.label}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label="City">
                    <div className="flex gap-2">
                      {CITIES.map((c) => (
                        <Chip key={c} active={orgCity === c} onClick={() => setOrgCity(c)}>
                          {c}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Field label="Apprenticeship standard">
                <select className="input w-full" value={standardCode} onChange={(e) => changeStandard(e.target.value as StandardCode)}>
                  {STANDARDS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.title} (Level {s.level}, {s.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Pathway / option">
                <select className="input w-full" value={pathway} onChange={(e) => setPathway(e.target.value)}>
                  {std.pathways.map((pw) => (
                    <option key={pw}>{pw}</option>
                  ))}
                </select>
              </Field>
              <Field label="Training provider" error={tried ? step2Errors.provider : undefined}>
                <input className="input w-full" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Thames Tech Training" />
              </Field>
              <Field label="Employer (optional)">
                <input className="input w-full" value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g. Brightwire Software" />
              </Field>
              <Field label="City">
                <div className="flex gap-2">
                  {CITIES.map((c) => (
                    <Chip key={c} active={city === c} onClick={() => setCity(c)}>
                      {c}
                    </Chip>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="OTJ target hours">
                  <input className="input w-full" type="number" min={0} value={otjTarget} onChange={(e) => setOtjTarget(Number(e.target.value))} />
                </Field>
                <Field label="OTJ hours logged">
                  <input className="input w-full" type="number" min={0} value={otjLogged} onChange={(e) => setOtjLogged(Number(e.target.value))} />
                </Field>
                <Field label="Gateway date">
                  <input className="input w-full" type="date" value={gateway} onChange={(e) => setGateway(e.target.value)} />
                </Field>
              </div>

              <div>
                <p className="text-sm font-semibold">KSBs already signed off</p>
                <p className="mb-3 text-sm text-gray-500">
                  {std.shortName} · {pathway}. Tick the ones your coach has signed off.
                </p>
                <div className="space-y-4">
                  {(['K', 'S', 'B'] as KsbType[]).map((t) => (
                    <div key={t}>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{KSB_TYPE_LABEL[t]}</p>
                      <ul className="space-y-0.5">
                        {ksbs
                          .filter((k) => k.type === t)
                          .map((k) => {
                            const on = signedOff.includes(k.id);
                            return (
                              <li key={k.id}>
                                <button
                                  type="button"
                                  role="checkbox"
                                  aria-checked={on}
                                  onClick={() => toggleSigned(k.id)}
                                  className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-stone-50"
                                >
                                  <span
                                    className={`mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-md border ${
                                      on ? 'border-otj bg-otj text-white' : 'border-gray-300 bg-white'
                                    }`}
                                  >
                                    {on && <Check className="size-3" strokeWidth={3.5} />}
                                  </span>
                                  <span>
                                    <span className="mr-1.5 font-bold">{k.code}</span>
                                    {k.text}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold">Coach's focus KSBs</p>
                <p className="mb-3 text-sm text-gray-500">Pick up to 3 your coach wants you to work on ({focus.length}/3).</p>
                <div className="flex flex-wrap gap-2">
                  {ksbs
                    .filter((k) => !signedOff.includes(k.id))
                    .map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        title={k.text}
                        aria-pressed={focus.includes(k.id)}
                        disabled={!focus.includes(k.id) && focus.length >= 3}
                        onClick={() => toggleFocus(k.id)}
                        className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-40 ${
                          focus.includes(k.id) ? 'border-accent bg-accent text-white' : 'border-line bg-white hover:border-gray-400'
                        }`}
                      >
                        {k.code}
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary w-full py-3">
            {editing ? 'Save baseline' : step === totalSteps ? 'Finish' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
