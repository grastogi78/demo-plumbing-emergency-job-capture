# Emergency Triage Demo

A standalone React/Vite/Tailwind frontend demo for an AI-assisted emergency plumbing intake workflow.

## Run Locally

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## What The Demo Shows

- A phone-style homeowner intake flow with step-by-step emergency plumbing questions.
- A customer confirmation screen with safe waiting guidance and a call button.
- A desktop dispatch summary with simulated priority, dispatcher summary, callback focus, dispatch type, and missing information flags.
- SMS and email notification previews.
- A simple office queue with the current mock lead.

## What Is Mocked

- No backend, authentication, database, email, SMS, or external APIs are used.
- The "AI-generated" summary is generated locally with deterministic TypeScript rules.
- Priority scoring is simulated from the intake answers.
- Customer and lead data are stored only in React state for the current browser session.

## Future MVP Notes

- Persist intake submissions to a backend lead table.
- Add role-based office login and dispatch queue assignment.
- Connect real SMS/email notifications after consent, compliance, and opt-out requirements are designed.
- Add technician availability, service area rules, and business-hour handling.
- Add audit logs that show which fields drove priority and routing decisions.
- Keep repair language framed as customer-reported information until a licensed technician evaluates the job.
