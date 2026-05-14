import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Droplets,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type View = "intake" | "confirmation" | "dispatch" | "notifications" | "queue";
type Priority = "Critical" | "High" | "Medium" | "Low";

type IntakeData = {
  issueType: string;
  waterFlowing: string;
  shutoffAttempted: string;
  location: string;
  access: string;
  name: string;
  phone: string;
  zip: string;
  notes: string;
};

type SummarySection = {
  title: string;
  items: string[];
};

type DispatchSummary = {
  priority: Priority;
  dispatcherSummary: SummarySection[];
  callbackFocus: string[];
  dispatchType: string;
  missingInfo: string[];
};

const initialIntake: IntakeData = {
  issueType: "Active leak",
  waterFlowing: "Yes",
  shutoffAttempted: "No",
  location: "Bathroom",
  access: "Yes",
  name: "Morgan Lee",
  phone: "(404) 555-0188",
  zip: "30004",
  notes: "Water is coming through the vanity cabinet and spreading into the hallway.",
};

const navItems: Array<{ id: View; label: string }> = [
  { id: "intake", label: "Intake" },
  { id: "confirmation", label: "Confirmation" },
  { id: "dispatch", label: "Dispatch Summary" },
  { id: "notifications", label: "Notification Preview" },
  { id: "queue", label: "Office Queue" },
];

const questions = [
  {
    key: "issueType",
    question: "What problem are you having?",
    options: ["Active leak", "Sewer backup", "No hot water", "Clogged drain", "Burst pipe", "Other"],
  },
  {
    key: "waterFlowing",
    question: "Is water actively flowing right now?",
    options: ["Yes", "No", "Not sure"],
  },
  {
    key: "shutoffAttempted",
    question: "Have you tried shutting off the water?",
    options: ["Yes", "No", "I don't know how"],
  },
  {
    key: "location",
    question: "Where is the issue?",
    options: ["Kitchen", "Bathroom", "Basement", "Water heater", "Yard", "Whole house"],
  },
  {
    key: "access",
    question: "Can a technician access the area?",
    options: ["Yes", "No", "Not sure"],
  },
] as const;

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createSummary(data: IntakeData): DispatchSummary {
  const issue = data.issueType.toLowerCase();
  const location = data.location.toLowerCase();
  const flowing = data.waterFlowing.toLowerCase();
  const shutoff = data.shutoffAttempted.toLowerCase();
  const access = data.access.toLowerCase();

  let priority: Priority = "Low";

  if (
    issue === "sewer backup" ||
    issue === "burst pipe" ||
    (issue === "active leak" && flowing === "yes") ||
    location === "whole house"
  ) {
    priority = "Critical";
  } else if (
    (issue === "active leak" && flowing !== "yes") ||
    location === "water heater" ||
    (issue === "clogged drain" && ["bathroom", "basement"].includes(location))
  ) {
    priority = "High";
  } else if (issue === "no hot water" || flowing === "not sure" || access === "not sure" || shutoff.includes("don't know")) {
    priority = "Medium";
  }

  if (issue === "other") {
    priority = "Low";
  }

  const missingInfo = [
    !data.name.trim() ? "Customer name" : "",
    !data.phone.trim() ? "Customer phone" : "",
    !data.zip.trim() ? "ZIP code" : "",
    data.waterFlowing === "Not sure" ? "Whether water is actively flowing" : "",
    data.access === "Not sure" ? "Technician access details" : "",
  ].filter(Boolean);

  const dispatcherSummary = [
    {
      title: "Customer-reported issue",
      items: [`Customer reports ${data.issueType.toLowerCase()} affecting the ${data.location.toLowerCase()}.`],
    },
    {
      title: "Current status",
      items: [
        `Water actively flowing: ${data.waterFlowing.toLowerCase()}.`,
        `Shutoff attempted: ${data.shutoffAttempted.toLowerCase()}.`,
        `Technician access: ${data.access.toLowerCase()}.`,
      ],
    },
    {
      title: "Customer notes",
      items: [data.notes.trim() ? data.notes.trim() : "No additional customer notes captured."],
    },
    {
      title: "Operational concern",
      items: [
        priority === "Critical"
          ? "Suggested callback focus: confirm immediate access, current water status, and whether the main shutoff is known."
          : priority === "High"
            ? "Suggested callback focus: confirm access window, affected area, and same-day availability."
            : "Suggested callback focus: confirm details needed to route the callback and scheduling next step.",
      ],
    },
  ];

  const callbackFocus = [
    "Confirm exact source or visible affected area without diagnosing the repair.",
    data.waterFlowing === "Yes" ? "Ask whether belongings can be moved away safely and whether the main shutoff is known." : "",
    data.access !== "Yes" ? "Clarify access constraints before assigning a technician." : "Confirm someone can meet the technician.",
    data.zip.trim() ? `Verify service availability for ZIP ${data.zip}.` : "Collect service ZIP before dispatching.",
  ].filter(Boolean);

  const dispatchType =
    priority === "Critical"
      ? "Immediate emergency callback and priority dispatch review"
      : priority === "High"
        ? "Same-day callback with emergency availability check"
        : priority === "Medium"
          ? "Callback for triage and schedule fit"
          : "Standard callback or estimate request review";

  return { priority, dispatcherSummary, callbackFocus, dispatchType, missingInfo };
}

function App() {
  const [view, setView] = useState<View>("intake");
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<IntakeData>(initialIntake);
  const summary = useMemo(() => createSummary(intake), [intake]);

  const updateField = (field: keyof IntakeData, value: string) => {
    setIntake((current) => ({ ...current, [field]: value }));
  };

  const submitIntake = (event: FormEvent) => {
    event.preventDefault();
    setView("confirmation");
  };

  return (
    <div className="min-h-screen bg-stone-100 text-slate-950">
      <TopNav active={view} onSelect={setView} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {view === "intake" && (
          <IntakeFlow
            data={intake}
            step={step}
            onStepChange={setStep}
            onUpdate={updateField}
            onSubmit={submitIntake}
          />
        )}
        {view === "confirmation" && <Confirmation data={intake} onDispatch={() => setView("dispatch")} />}
        {view === "dispatch" && <DispatchSummaryView data={intake} summary={summary} onNotifications={() => setView("notifications")} />}
        {view === "notifications" && <NotificationPreview data={intake} summary={summary} />}
        {view === "queue" && <OfficeQueue data={intake} summary={summary} onOpen={() => setView("dispatch")} />}
      </main>
    </div>
  );
}

function TopNav({ active, onSelect }: { active: View; onSelect: (view: View) => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">Emergency triage demo</p>
          <h1 className="text-xl font-semibold text-slate-950">AI-assisted plumbing intake workflow</h1>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                active === item.id
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function IntakeFlow({
  data,
  step,
  onStepChange,
  onUpdate,
  onSubmit,
}: {
  data: IntakeData;
  step: number;
  onStepChange: (step: number) => void;
  onUpdate: (field: keyof IntakeData, value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const atContact = step === questions.length;
  const progress = ((step + 1) / (questions.length + 1)) * 100;

  return (
    <section className="grid min-h-[calc(100vh-128px)] items-center gap-8 lg:grid-cols-[1fr_420px_1fr]">
      <div className="hidden lg:block">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-red-700">Homeowner side</p>
        <h2 className="max-w-sm text-3xl font-semibold tracking-tight text-slate-950">
          Calm intake for high-stress plumbing calls.
        </h2>
        <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
          The mobile flow captures just enough context for the office to prioritize the lead and call back with focus.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-[390px] rounded-[2rem] border-8 border-slate-900 bg-slate-950 p-2 shadow-phone">
        <div className="min-h-[760px] overflow-hidden rounded-[1.45rem] bg-white">
          <div className="flex items-center justify-between bg-red-700 px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-100">24/7 intake</p>
              <h2 className="text-xl font-semibold">Emergency Plumbing Help</h2>
            </div>
            <a href="tel:+14045550188" className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-700">
              <Phone className="h-4 w-4" />
              Call Now
            </a>
          </div>

          <div className="px-5 py-5">
            <p className="text-sm leading-6 text-slate-600">
              Tell us what's happening. We'll help route your request faster.
            </p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-red-700 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="px-5 pb-5">
            {!atContact ? (
              <QuestionStep
                index={step}
                data={data}
                onUpdate={onUpdate}
                onNext={() => onStepChange(Math.min(step + 1, questions.length))}
              />
            ) : (
              <ContactStep data={data} onUpdate={onUpdate} />
            )}
          </div>

          <div className="sticky bottom-0 mt-auto border-t border-slate-200 bg-white px-5 py-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onStepChange(Math.max(step - 1, 0))}
                disabled={step === 0}
                className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-slate-300 text-slate-700 disabled:opacity-40"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              {atContact ? (
                <button className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-base font-semibold text-white hover:bg-red-800">
                  Submit request
                  <ShieldCheck className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStepChange(Math.min(step + 1, questions.length))}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-base font-semibold text-white hover:bg-slate-800"
                >
                  Next
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
            <a href="tel:+14045550188" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <Phone className="h-4 w-4" />
              Call Now
            </a>
          </div>
        </div>
      </form>

      <StatusPanel data={data} />
    </section>
  );
}

function QuestionStep({
  index,
  data,
  onUpdate,
  onNext,
}: {
  index: number;
  data: IntakeData;
  onUpdate: (field: keyof IntakeData, value: string) => void;
  onNext: () => void;
}) {
  const question = questions[index];
  const field = question.key as keyof IntakeData;

  return (
    <div>
      <p className="text-sm font-medium text-slate-500">Question {index + 1} of 6</p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight text-slate-950">{question.question}</h3>
      <div className="mt-5 grid gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onUpdate(field, option);
              setTimeout(onNext, 120);
            }}
            className={`min-h-14 rounded-md border px-4 py-4 text-left text-base font-semibold transition ${
              data[field] === option
                ? "border-red-700 bg-red-50 text-red-800"
                : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactStep({ data, onUpdate }: { data: IntakeData; onUpdate: (field: keyof IntakeData, value: string) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">Question 6 of 6</p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight text-slate-950">Contact details</h3>
      <div className="mt-5 grid gap-4">
        <TextField label="Name" value={data.name} onChange={(value) => onUpdate("name", value)} />
        <TextField label="Phone" value={data.phone} onChange={(value) => onUpdate("phone", value)} />
        <TextField label="ZIP code" value={data.zip} onChange={(value) => onUpdate("zip", value)} />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Optional notes</span>
          <textarea
            value={data.notes}
            onChange={(event) => onUpdate("notes", event.target.value)}
            className="min-h-24 rounded-md border border-slate-300 px-3 py-3 text-base outline-none ring-red-700/20 focus:border-red-700 focus:ring-4"
          />
        </label>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-md border border-slate-300 px-3 text-base outline-none ring-red-700/20 focus:border-red-700 focus:ring-4"
      />
    </label>
  );
}

function StatusPanel({ data }: { data: IntakeData }) {
  return (
    <aside className="hidden rounded-lg border border-slate-200 bg-white p-5 shadow-panel lg:block">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Captured so far</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <Row label="Issue" value={data.issueType} />
        <Row label="Flowing" value={data.waterFlowing} />
        <Row label="Shutoff" value={data.shutoffAttempted} />
        <Row label="Location" value={data.location} />
        <Row label="Access" value={data.access} />
        <Row label="ZIP" value={data.zip || "Not captured"} />
      </dl>
    </aside>
  );
}

function Confirmation({ data, onDispatch }: { data: IntakeData; onDispatch: () => void }) {
  return (
    <section className="mx-auto grid max-w-4xl gap-6 py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-panel">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">We received your emergency request</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Based on what you shared, this may require urgent attention. A team member should contact you shortly using
          the phone number you provided.
        </p>
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-950">While you wait</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-950">
            <li>If water is actively flowing, move belongings away from the affected area if safe.</li>
            <li>If you know where your home's main shutoff valve is located, consider shutting off the water if safe.</li>
            <li>For immediate emergencies, calling directly may still be the fastest option.</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href="tel:+14045550188" className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800">
            <Phone className="h-5 w-5" />
            Call Now
          </a>
          <button onClick={onDispatch} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800">
            <ClipboardList className="h-5 w-5" />
            View Office Summary
          </button>
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">Demo lead: {data.name || "Customer"} · {data.phone || "phone pending"}</p>
    </section>
  );
}

function DispatchSummaryView({
  data,
  summary,
  onNotifications,
}: {
  data: IntakeData;
  summary: DispatchSummary;
  onNotifications: () => void;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Office dispatch summary</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">New emergency plumbing intake</h2>
          </div>
          <PriorityBadge priority={summary.priority} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric icon={Droplets} label="Issue type" value={data.issueType} />
          <Metric icon={Wrench} label="Location in home" value={data.location} />
          <Metric icon={AlertTriangle} label="Water actively flowing" value={data.waterFlowing} />
          <Metric icon={ShieldCheck} label="Shutoff attempted" value={data.shutoffAttempted} />
          <Metric icon={Clock3} label="Availability/access" value={data.access} />
          <Metric icon={Phone} label="Phone and ZIP" value={`${data.phone || "Missing"} · ${data.zip || "Missing"}`} />
        </div>

        <div className="mt-6 grid gap-5">
          <InfoBlock title="AI-generated dispatcher summary" icon={FileText}>
            <StructuredSummary sections={summary.dispatcherSummary} />
          </InfoBlock>
          <InfoBlock title="Suggested callback focus" icon={Phone}>
            <ul className="grid gap-2">
              {summary.callbackFocus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </InfoBlock>
          <InfoBlock title="Suggested dispatch type" icon={Wrench}>
            <p>{summary.dispatchType}</p>
          </InfoBlock>
        </div>
      </div>

      <aside className="grid content-start gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold text-slate-950">Missing information flags</h3>
          <div className="mt-4 grid gap-2">
            {summary.missingInfo.length ? (
              summary.missingInfo.map((item) => (
                <span key={item} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                  {item}
                </span>
              ))
            ) : (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                No major intake gaps
              </span>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <h3 className="text-lg font-semibold text-slate-950">Demo guardrail</h3>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This frontend only summarizes what the customer reports. It does not diagnose the repair, assign a price, or
            send real messages.
          </p>
          <button onClick={onNotifications} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800">
            <Mail className="h-5 w-5" />
            View notifications
          </button>
        </div>
      </aside>
    </section>
  );
}

function NotificationPreview({ data, summary }: { data: IntakeData; summary: DispatchSummary }) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <PreviewCard title="SMS preview" icon={Smartphone}>
        <div className="max-w-sm rounded-2xl bg-slate-950 p-4 text-white">
          <p className="font-semibold">New Emergency Lead</p>
          <p className="mt-3">Priority: {summary.priority}</p>
          <p>Issue: {data.issueType}</p>
          <p>Customer: {data.name || "Name missing"}</p>
          <p>Phone: {data.phone || "Phone missing"}</p>
          <p>ZIP: {data.zip || "Missing"}</p>
          <p>Customer available now</p>
          <p className="mt-3 font-semibold text-red-200">View dispatch summary</p>
        </div>
      </PreviewCard>

      <PreviewCard title="Email preview" icon={Mail}>
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</p>
            <p className="mt-1 font-semibold text-slate-950">
              New Emergency Plumbing Intake - {summary.priority} Priority
            </p>
          </div>
          <div className="grid gap-4 px-5 py-5 text-sm leading-6 text-slate-700">
            <StructuredSummary sections={summary.dispatcherSummary.filter((section) => section.title !== "Operational concern")} />
            <div>
              <p className="font-semibold text-slate-950">Callback focus</p>
              <ul className="mt-2 grid gap-1">
                {summary.callbackFocus.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PreviewCard>
    </section>
  );
}

function OfficeQueue({ data, summary, onOpen }: { data: IntakeData; summary: DispatchSummary; onOpen: () => void }) {
  const stages = [
    { label: "New", count: 1 },
    { label: "Urgent", count: summary.priority === "Critical" || summary.priority === "High" ? 1 : 0 },
    { label: "Callback Pending", count: 2 },
    { label: "Scheduled", count: 4 },
  ];

  return (
    <section className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Office queue</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Emergency intake board</h2>
          </div>
          <button onClick={onOpen} className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800">
            Open Dispatch Summary
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-600">{stage.label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{stage.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="grid grid-cols-1 gap-0 divide-y divide-slate-200 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_auto] lg:divide-x lg:divide-y-0">
          <QueueCell label="Customer" value={data.name || "Name missing"} detail={data.phone || "Phone missing"} />
          <QueueCell label="Priority" value={summary.priority} detail={summary.dispatchType} />
          <QueueCell label="Issue" value={data.issueType} detail={data.location} />
          <QueueCell label="ZIP" value={data.zip || "Missing"} detail="Received 2 min ago" />
          <div className="p-4">
            <button onClick={onOpen} className="w-full rounded-md border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">
              Review Intake
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const classes: Record<Priority, string> = {
    Critical: "border-red-200 bg-red-700 text-white",
    High: "border-orange-200 bg-orange-100 text-orange-900",
    Medium: "border-amber-200 bg-amber-100 text-amber-900",
    Low: "border-slate-200 bg-slate-100 text-slate-800",
  };

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold ${classes[priority]}`}>
      <AlertTriangle className="h-4 w-4" />
      {priority}
    </span>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Droplets; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-red-700" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function InfoBlock({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-red-700" />
        <h3 className="font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </div>
  );
}

function StructuredSummary({ sections }: { sections: SummarySection[] }) {
  return (
    <div className="grid gap-4">
      {sections.map((section) => (
        <section key={section.title}>
          <h4 className="font-semibold text-slate-950">{section.title}</h4>
          <ul className="mt-2 grid gap-1">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PreviewCard({ title, icon: Icon, children }: { title: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
      <div className="mb-5 flex items-center gap-2">
        <Icon className="h-5 w-5 text-red-700" />
        <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function QueueCell({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-900">{titleCase(value)}</dd>
    </div>
  );
}

export default App;
