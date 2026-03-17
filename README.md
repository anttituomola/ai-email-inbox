# AI Email Inbox MVP

A minimal internal dashboard for hotel staff to review and send AI-generated email replies with trust-first workflows.

## Core Concept

The product focuses on **human-reviewed AI assistance** - making staff faster and safer at handling guest emails. Instead of automating everything, it provides:

- AI drafts from known hotel information
- Clear visibility into what's supported vs unsupported
- Easy review and editing workflow
- Fast "Send & Next" flow for processing multiple emails

The public landing page can stay open, while the working app can be protected with a backend-validated demo password gate.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: SQLite (local file-based)
- **AI**: OpenAI Responses API with structured JSON output

## Quick Start

### Option 1: Start Both at Once (Recommended)

```bash
cd frontend
npm install
npm start
```

This starts both the backend (port 8000) and frontend (port 5173) in parallel with color-coded output.

### Option 2: Start Separately

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 3. Open the App

Navigate to `http://localhost:5173` in your browser.

## Demo Data

The app comes with 6 pre-seeded guest emails:

1. **Check-in time question** - Fully answerable
2. **Spa and breakfast questions** - Fully answerable, multiple topics
3. **Parking + airport shuttle** - Partially answerable (parking yes, shuttle not supported)
4. **Restaurant reservation** - Unsupported (triggers review item)
5. **Pets + late checkout + balcony** - Mixed (pets and late checkout supported, balcony not)
6. **Cancellation question** - Fully answerable

## Key Features

### Inbox View
- Clean list with sender, subject, preview, status, and date
- Filter by: All, Open, Needs Review, Resolved
- Sort by newest or oldest first
- Click any email to open

### Dashboard View
- Inbox overview with unresolved, needs review, and resolved metrics
- Median handling time cards for today and the current week
- "Start Handling Emails" shortcut into the oldest unresolved open email

### Email Detail View
- Guest information card with guest name and email
- Full original message
- Editable draft reply area
- Review checklist panel showing:
  - Supporting facts used
  - Unanswered questions
  - Review items requiring attention

### AI Draft Generation
- "Generate Draft" button creates AI-assisted reply
- Only answers what can be supported by hotel knowledge base
- No placeholder text in guest-facing drafts
- Returns explicit review checklist

### Actions
- **Generate Draft**: Create AI-assisted reply
- **Generate Drafts for Open**: Batch-generate drafts for open emails without drafts
- **Mark Needs Review**: Flag for later
- **Send**: Send the reply
- **Undo Send**: Restore a just-sent email to its previous state
- **Send & Next**: Send and automatically open next email

### Status System
- **Open**: New or in progress
- **Needs Review**: Flagged for additional review
- **Resolved**: Reply sent

## Hotel Knowledge Base

The demo includes policies for:
- Check-in/check-out times
- Early check-in (with fee)
- Late arrival
- Spa access
- Parking
- Breakfast
- Pets
- Cancellation

## Project Structure

```
ai-email-inbox/
├── backend/
│   ├── main.py              # FastAPI entry point
│   ├── database.py          # SQLAlchemy session + startup setup
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── seed_data.py         # Demo data
│   ├── services/            # Shared backend business logic
│   │   ├── ai_client.py
│   │   ├── ai_draft_service.py
│   │   ├── ai_prompt_service.py
│   │   ├── ai_response_service.py
│   │   └── email_service.py
│   └── routes/
│       ├── emails.py        # Thin email endpoints
│       ├── drafts.py        # Thin draft/send endpoints
│       └── ai.py            # Thin AI generation endpoint
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Top-level app layout
│   │   ├── api.ts           # API client
│   │   ├── constants/
│   │   ├── hooks/
│   │   ├── types.ts         # TypeScript types
│   │   ├── utils/
│   │   ├── components/
│   │   │   ├── InboxList.tsx
│   │   │   ├── EmailWorkspace.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ReviewChecklist.tsx
│   │   │   └── StatusBadge.tsx
│   │   └── ...
│   └── package.json
└── README.md
```

## API Endpoints

### Emails
- `GET /api/emails` - List emails (optional ?status filter)
- `GET /api/emails/stats` - Get dashboard statistics
- `GET /api/emails/{id}` - Get email detail
- `PATCH /api/emails/{id}/status` - Update status

### Drafts
- `PATCH /api/drafts/{id}` - Save draft text
- `POST /api/drafts/{id}/send` - Send reply
- `POST /api/drafts/{id}/undo-send` - Undo a sent reply
- `POST /api/drafts/{id}/send-and-next` - Send and get next email

### AI
- `GET /api/ai/models` - Get supported AI models and default model
- `POST /api/ai/generate-draft` - Generate AI draft with review checklist
- `POST /api/ai/review-draft` - Rebuild the review checklist for an existing draft
- `POST /api/ai/generate-open-drafts/stream` - Stream batch draft generation progress

## OpenAI Setup

Add your API key to `backend/.env`:

```env
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=gpt-5-nano
```

If `OPENAI_MODEL` is omitted, the backend defaults to `gpt-5-nano`.

## Design Principles

1. **Simplicity**: Few features, focused workflow
2. **Trust over automation**: Visible AI reasoning, not hidden
3. **Fast handling**: Send & Next workflow
4. **Safe-by-default**: No placeholder text, clear unsupported items
5. **Human in control**: Always editable, always reviewable

## Out of Scope

- Real email sending (just logs to database)
- Full user authentication and account management
- Complex threading
- Folders/labels

## Future Improvements

These are ideas intentionally left out of the MVP so the current product stays simple, maintainable, and easy to evaluate:

- Stronger source-backed validation UX, such as making supported claims more visually prominent inside the draft and surfacing their sources even faster during review.
- Richer seeded data for customer profiles, thread history, and hotel FAQ content so AI suggestions can be reviewed against clearer internal sources.
- More advanced workflow states like snoozing, delegation, review ownership, and scheduled follow-up behavior.
- Two-step validation for drafts: cheap deterministic checks for concrete facts first, then low-cost AI fact checking.
- Background analytics and pre-generated draft queues for emails that appear safe to answer quickly.
- Tone controls and eventually a feedback loop that learns from approved sent replies.
