import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Droplets,
  FileText,
  Image,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Upload,
  Wrench,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "intake" | "confirmation" | "dispatch" | "notifications" | "queue";
type Priority = "Critical" | "Urgent" | "Routine";
type CustomerTone = "High" | "Medium" | "Low";

type UploadedMedia = {
  name: string;
  type: string;
  url: string;
};

type IntakeData = {
  issueType: string;
  waterFlowing: string;
  shutoffAttempted: string;
  location: string;
  access: string;
  propertyType: string;
  name: string;
  phone: string;
  addressOrZip: string;
  email: string;
  bestTime: string;
  notes: string;
  submittedAt: string;
  media: UploadedMedia[];
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
  responseTiming: string;
  tone: CustomerTone;
  revenueFlags: string[];
  missingInfo: string[];
};

type QueueItem = {
  customer: string;
  phone: string;
  priority: Priority;
  status: "New" | "Urgent" | "Callback Pending" | "Scheduled";
  issue: string;
  location: string;
  addressOrZip: string;
  received: string;
  timing: string;
};

const demoPhoneDisplay = "(404) 555-0188";
const demoPhoneHref = "tel:+14045550188";

const initialIntake: IntakeData = {
  issueType: "Active leak",
  waterFlowing: "Yes",
  shutoffAttempted: "No",
  location: "Bathroom",
  access: "Yes",
  propertyType: "Single-family home",
  name: "Morgan Lee",
  phone: demoPhoneDisplay,
  addressOrZip: "30004",
  email: "",
  bestTime: "As soon as possible",
  notes: "Water is coming through the vanity cabinet and spreading into the hallway.",
  submittedAt: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
  media: [],
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

const hashRoutes: Record<string, View> = {
  "#intake": "intake",
  "#confirmation": "confirmation",
  "#dispatch": "dispatch",
  "#notifications": "notifications",
  "#queue": "queue",
  "#office": "queue",
};

const demoQueueItems: QueueItem[] = [
  {
    customer: "Linda Garcia",
    phone: "(404) 555-0126",
    priority: "Critical",
    status: "Urgent",
    issue: "Sewer backup",
    location: "Basement",
    addressOrZip: "30002",
    received: "4 min ago",
    timing: "Within 30 minutes",
  },
  {
    customer: "Robert Miller",
    phone: "(404) 555-0194",
    priority: "Critical",
    status: "New",
    issue: "Burst pipe",
    location: "Main line",
    addressOrZip: "30004",
    received: "9 min ago",
    timing: "Within 30 minutes",
  },
  {
    customer: "Angela Davis",
    phone: "(404) 555-0181",
    priority: "Urgent",
    status: "Callback Pending",
    issue: "Leaking water heater",
    location: "Garage",
    addressOrZip: "30009",
    received: "18 min ago",
    timing: "Same day",
  },
  {
    customer: "Sarah Johnson",
    phone: "(404) 555-0142",
    priority: "Routine",
    status: "Scheduled",
    issue: "No hot water",
    location: "Water heater",
    addressOrZip: "30005",
    received: "43 min ago",
    timing: "Next available appointment",
  },
  {
    customer: "Mike Chen",
    phone: "(404) 555-0176",
    priority: "Routine",
    status: "Scheduled",
    issue: "Clogged kitchen drain",
    location: "Kitchen",
    addressOrZip: "30008",
    received: "1 hr ago",
    timing: "Next available appointment",
  },
  {
    customer: "Patel Family Trust",
    phone: "(404) 555-0168",
    priority: "Urgent",
    status: "Callback Pending",
    issue: "Multiple units without hot water",
    location: "Apartment building",
    addressOrZip: "30003",
    received: "1 hr 16 min ago",
    timing: "Same day",
  },
  {
    customer: "Northside Cafe",
    phone: "(404) 555-0153",
    priority: "Urgent",
    status: "Scheduled",
    issue: "Restroom drain backup",
    location: "Commercial restroom",
    addressOrZip: "30007",
    received: "2 hr ago",
    timing: "Same day",
  },
];

function getInitialView(): View {
  if (typeof window === "undefined") return "intake";
  return hashRoutes[window.location.hash] ?? "intake";
}

function formatSubmittedTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function elapsedWaiting(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} hr ${remaining} min` : `${hours} hr`;
}

function createSummary(data: IntakeData): DispatchSummary {
  const issue = data.issueType.toLowerCase();
  const location = data.location.toLowerCase();
  const flowing = data.waterFlowing.toLowerCase();
  const shutoff = data.shutoffAttempted.toLowerCase();
  const access = data.access.toLowerCase();
  const notes = data.notes.toLowerCase();
  const property = data.propertyType.toLowerCase();

  let priority: Priority = "Routine";

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
    priority = "Urgent";
  }

  if (issue === "other") {
    priority = "Routine";
  }

  const responseTiming =
    priority === "Critical" ? "Within 30 minutes" : priority === "Urgent" ? "Same day" : "Next available appointment";

  const tone: CustomerTone =
    priority === "Critical" || flowing === "yes" || /flood|panic|emergency|sewage|burst|ceiling|damage/.test(notes)
      ? "High"
      : priority === "Urgent" || flowing === "not sure" || access === "not sure" || shutoff.includes("don't know")
        ? "Medium"
        : "Low";

  const revenueFlags = [
    property.includes("commercial") ? "Commercial property" : "",
    property.includes("multi-unit") || property.includes("apartment") ? "Multi-unit property" : "",
    /ceiling|floor|wall|flood|damage|spreading|soaked/.test(notes) || (issue === "burst pipe" && flowing === "yes")
      ? "Severe water damage concern"
      : "",
    /insurance|claim|adjuster/.test(notes) ? "Insurance claim potential" : "",
    priority === "Critical" || issue === "sewer backup" || issue === "burst pipe" ? "Emergency/high-value job" : "",
  ].filter(Boolean);

  const missingInfo = [
    !data.name.trim() ? "Customer name" : "",
    !data.phone.trim() ? "Customer phone" : "",
    !data.addressOrZip.trim() ? "Address or ZIP" : "",
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
          ? "Recommended response: confirm immediate access, current water status, and whether the main shutoff is known."
          : priority === "Urgent"
            ? "Recommended response: confirm access window, affected area, and same-day availability."
            : "Recommended response: confirm details needed to route the callback and scheduling next step.",
      ],
    },
  ];

  const callbackFocus = [
    "Confirm exact source or visible affected area without assuming the repair needed.",
    data.waterFlowing === "Yes" ? "Ask whether belongings can be moved away safely and whether the main shutoff is known." : "",
    data.access !== "Yes" ? "Clarify access constraints before assigning a technician." : "Confirm someone can meet the technician.",
    data.addressOrZip.trim() ? `Verify service availability for ${data.addressOrZip}.` : "Collect address or ZIP before dispatching.",
  ].filter(Boolean);

  const dispatchType =
    priority === "Critical"
      ? "Immediate emergency callback and priority dispatch review"
      : priority === "Urgent"
        ? "Same-day callback with emergency availability check"
        : "Standard callback or estimate request review";

  return { priority, dispatcherSummary, callbackFocus, dispatchType, responseTiming, tone, revenueFlags, missingInfo };
}

function App() {
  const [view, setView] = useState<View>(getInitialView);
  const [step, setStep] = useState(0);
  const [intake, setIntake] = useState<IntakeData>(initialIntake);
  const summary = useMemo(() => createSummary(intake), [intake]);

  useEffect(() => {
    const onHashChange = () => setView(getInitialView());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (nextView: View) => {
    setView(nextView);
    const nextHash = nextView === "intake" ? "#intake" : `#${nextView}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, "", nextHash);
    }
  };

  const updateField = (field: keyof IntakeData, value: string) => {
    setIntake((current) => ({ ...current, [field]: value }));
  };

  const updateMedia = (media: UploadedMedia[]) => {
    setIntake((current) => {
      current.media.forEach((item) => URL.revokeObjectURL(item.url));
      return { ...current, media };
    });
  };

  const submitIntake = (event: FormEvent) => {
    event.preventDefault();
    setIntake((current) => ({ ...current, submittedAt: new Date().toISOString() }));
    setView("confirmation");
    window.history.pushState(null, "", "#confirmation");
  };

  return (
    <div className="min-h-screen bg-stone-100 text-slate-950">
      <TopNav active={view} onSelect={navigate} showInternal={view !== "intake" && view !== "confirmation"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {view === "intake" && (
          <IntakeFlow
            data={intake}
            step={step}
            onStepChange={setStep}
            onUpdate={updateField}
            onMediaChange={updateMedia}
            onSubmit={submitIntake}
          />
        )}
        {view === "confirmation" && <Confirmation data={intake} />}
        {view === "dispatch" && <DispatchSummaryView data={intake} summary={summary} onNotifications={() => navigate("notifications")} />}
        {view === "notifications" && <NotificationPreview data={intake} summary={summary} />}
        {view === "queue" && <OfficeQueue onOpen={() => navigate("dispatch")} />}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-6 text-center text-xs leading-5 text-slate-500 sm:px-6 lg:px-8">
        Demo only. This tool summarizes customer-reported information and does not diagnose repairs, quote prices, or
        send real messages.
      </footer>
    </div>
  );
}

function TopNav({ active, onSelect, showInternal }: { active: View; onSelect: (view: View) => void; showInternal: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
            {showInternal ? "Emergency intake demo" : "24/7 emergency intake"}
          </p>
          <h1 className="text-xl font-semibold text-slate-950">
            {showInternal ? "Emergency plumbing intake workflow" : "Emergency Plumbing Help"}
          </h1>
        </div>
        {showInternal && (
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                  active === item.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

function IntakeFlow({
  data,
  step,
  onStepChange,
  onUpdate,
  onMediaChange,
  onSubmit,
}: {
  data: IntakeData;
  step: number;
  onStepChange: (step: number) => void;
  onUpdate: (field: keyof IntakeData, value: string) => void;
  onMediaChange: (media: UploadedMedia[]) => void;
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
          The mobile flow captures just enough customer-reported context for the office to prioritize a callback.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mx-auto w-full max-w-[390px] rounded-[2rem] border-8 border-slate-900 bg-slate-950 p-2 shadow-phone">
        <div className="min-h-[760px] overflow-hidden rounded-[1.45rem] bg-white">
          <div className="flex items-center justify-between bg-red-700 px-5 py-4 text-white">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-red-100">24/7 intake</p>
              <h2 className="text-xl font-semibold">Emergency Plumbing Help</h2>
            </div>
            <a href={demoPhoneHref} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-red-700">
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
              <ContactStep data={data} onUpdate={onUpdate} onMediaChange={onMediaChange} />
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
            <a href={demoPhoneHref} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <Phone className="h-4 w-4" />
              Call Now
            </a>
          </div>
        </div>
      </form>

      <ReviewPanel data={data} />
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

function ContactStep({
  data,
  onUpdate,
  onMediaChange,
}: {
  data: IntakeData;
  onUpdate: (field: keyof IntakeData, value: string) => void;
  onMediaChange: (media: UploadedMedia[]) => void;
}) {
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    onMediaChange(
      Array.from(files).map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      })),
    );
  };

  return (
    <div>
      <p className="text-sm font-medium text-slate-500">Question 6 of 6</p>
      <h3 className="mt-2 text-2xl font-semibold leading-tight text-slate-950">Contact and dispatch details</h3>
      <div className="mt-5 grid gap-4">
        <TextField label="Name" value={data.name} onChange={(value) => onUpdate("name", value)} required />
        <TextField label="Phone" value={data.phone} onChange={(value) => onUpdate("phone", value)} required />
        <TextField label="Address or ZIP" value={data.addressOrZip} onChange={(value) => onUpdate("addressOrZip", value)} required />
        <TextField label="Email (optional)" value={data.email} onChange={(value) => onUpdate("email", value)} type="email" />
        <TextField label="Best time to call back (optional)" value={data.bestTime} onChange={(value) => onUpdate("bestTime", value)} />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">Property type</span>
          <select
            value={data.propertyType}
            onChange={(event) => onUpdate("propertyType", event.target.value)}
            className="h-12 rounded-md border border-slate-300 px-3 text-base outline-none ring-red-700/20 focus:border-red-700 focus:ring-4"
          >
            <option>Single-family home</option>
            <option>Commercial property</option>
            <option>Multi-unit property</option>
          </select>
        </label>
        <label className="grid gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Upload className="h-4 w-4" />
            Photos or videos (optional)
          </span>
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
            className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        </label>
        {data.media.length > 0 && <MediaPreview media={data.media} compact />}
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

function TextField({
  label,
  value,
  onChange,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-md border border-slate-300 px-3 text-base outline-none ring-red-700/20 focus:border-red-700 focus:ring-4"
      />
    </label>
  );
}

function ReviewPanel({ data }: { data: IntakeData }) {
  return (
    <aside className="hidden rounded-lg border border-slate-200 bg-white p-5 shadow-panel lg:block">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Review your request</p>
      <dl className="mt-4 grid gap-3 text-sm">
        <Row label="Issue" value={data.issueType} />
        <Row label="Flowing" value={data.waterFlowing} />
        <Row label="Shutoff" value={data.shutoffAttempted} />
        <Row label="Location" value={data.location} />
        <Row label="Access" value={data.access} />
        <Row label="Address/ZIP" value={data.addressOrZip || "Not captured"} />
      </dl>
    </aside>
  );
}

function Confirmation({ data }: { data: IntakeData }) {
  return (
    <section className="mx-auto grid max-w-4xl gap-6 py-8">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-panel">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">We received your emergency request</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          A team member should contact you shortly using the phone number you provided. Your request will be reviewed
          based on the reported issue and current service availability.
        </p>
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-950">Review your request</h3>
          <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <Row label="Name" value={data.name || "Missing"} />
            <Row label="Phone" value={data.phone || "Missing"} />
            <Row label="Address/ZIP" value={data.addressOrZip || "Missing"} />
            <Row label="Reported issue" value={`${data.issueType} - ${data.location}`} />
          </dl>
          {data.media.length > 0 && <MediaPreview media={data.media} compact />}
        </div>
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-950">While you wait</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-amber-950">
            <li>If water is actively flowing, move belongings away from the affected area if safe.</li>
            <li>If you know where your home's main shutoff valve is located, consider shutting off the water if safe.</li>
            <li>For immediate emergencies, calling directly may still be the fastest option.</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a href={demoPhoneHref} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-800">
            <Phone className="h-5 w-5" />
            Call Now {demoPhoneDisplay}
          </a>
        </div>
      </div>
      <p className="text-center text-sm text-slate-500">Request submitted for {data.name || "Customer"} · {data.phone || "phone pending"}</p>
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
  const priorityFrame: Record<Priority, string> = {
    Critical: "border-red-500",
    Urgent: "border-amber-400",
    Routine: "border-emerald-500",
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className={`rounded-lg border-l-4 bg-white p-6 shadow-panel ${priorityFrame[summary.priority]}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Office dispatch summary</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">AI-assisted summary for reported issue</h2>
          </div>
          <PriorityBadge priority={summary.priority} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Metric icon={Droplets} label="Issue type" value={data.issueType} />
          <Metric icon={Wrench} label="Location in home" value={data.location} />
          <Metric icon={AlertTriangle} label="Water actively flowing" value={data.waterFlowing} />
          <Metric icon={ShieldCheck} label="Shutoff attempted" value={data.shutoffAttempted} />
          <Metric icon={Clock3} label="Availability/access" value={data.access} />
          <Metric icon={Phone} label="Phone and service area" value={`${data.phone || "Missing"} · ${data.addressOrZip || "Missing"}`} />
          <Metric icon={CalendarClock} label="Submitted" value={formatSubmittedTime(data.submittedAt)} />
          <Metric icon={Clock3} label="Elapsed waiting" value={elapsedWaiting(data.submittedAt)} />
          <Metric icon={AlertTriangle} label="Customer urgency/tone" value={summary.tone} />
        </div>

        <div className="mt-6 grid gap-5">
          <InfoBlock title="AI-assisted summary" icon={FileText}>
            <StructuredSummary sections={summary.dispatcherSummary} />
          </InfoBlock>
          <InfoBlock title="Recommended response" icon={Clock3}>
            <p>{summary.responseTiming}</p>
          </InfoBlock>
          <InfoBlock title="Callback focus" icon={Phone}>
            <ul className="grid gap-2">
              {summary.callbackFocus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </InfoBlock>
          <InfoBlock title="Dispatch review type" icon={Wrench}>
            <p>{summary.dispatchType}</p>
          </InfoBlock>
          <InfoBlock title="Customer media" icon={Image}>
            {data.media.length ? <MediaPreview media={data.media} /> : <p>No photo or video files selected.</p>}
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
          <h3 className="text-lg font-semibold text-slate-950">Revenue opportunity flags</h3>
          <div className="mt-4 grid gap-2">
            {summary.revenueFlags.length ? (
              summary.revenueFlags.map((item) => (
                <span key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800">
                  {item}
                </span>
              ))
            ) : (
              <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                No high-value flags from customer-reported information
              </span>
            )}
          </div>
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
          <p>Service area: {data.addressOrZip || "Missing"}</p>
          <p>Recommended response: {summary.responseTiming}</p>
          <p>{data.bestTime || "Callback time not provided"}</p>
          <p className="mt-3 font-semibold text-red-200">Open internal dispatch summary</p>
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

function OfficeQueue({ onOpen }: { onOpen: () => void }) {
  const stages = ["New", "Urgent", "Callback Pending", "Scheduled"].map((label) => ({
    label,
    count: demoQueueItems.filter((item) => item.status === label).length,
  }));

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
        <div className="divide-y divide-slate-200">
          {demoQueueItems.map((item) => (
            <div
              key={`${item.customer}-${item.issue}`}
              className="grid grid-cols-1 gap-0 lg:grid-cols-[1.15fr_0.75fr_0.9fr_0.7fr_0.8fr_auto]"
            >
              <QueueCell label="Customer" value={item.customer} detail={item.phone} />
              <QueueCell label="Priority" value={item.priority} detail={item.timing} />
              <QueueCell label="Issue" value={item.issue} detail={item.location} />
              <QueueCell label="Service area" value={item.addressOrZip} detail={item.received} />
              <QueueCell label="Status" value={item.status} detail="Office queue" />
              <div className="p-4">
                <button onClick={onOpen} className="w-full rounded-md border border-slate-300 px-4 py-3 font-semibold text-slate-800 hover:bg-slate-50">
                  Review Intake
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const classes: Record<Priority, string> = {
    Critical: "border-red-200 bg-red-700 text-white",
    Urgent: "border-amber-200 bg-amber-100 text-amber-900",
    Routine: "border-emerald-200 bg-emerald-100 text-emerald-900",
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
      <dd className="text-right font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function MediaPreview({ media, compact = false }: { media: UploadedMedia[]; compact?: boolean }) {
  return (
    <div className={`mt-3 grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      {media.map((item) => (
        <div key={`${item.name}-${item.url}`} className="rounded-md border border-slate-200 bg-white p-3">
          {item.type.startsWith("image/") ? (
            <img src={item.url} alt={item.name} className="h-28 w-full rounded-md object-cover" />
          ) : item.type.startsWith("video/") ? (
            <video src={item.url} className="h-28 w-full rounded-md object-cover" controls />
          ) : null}
          <p className="mt-2 truncate text-sm font-medium text-slate-800">{item.name}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
