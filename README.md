# Centre Lead Tracker

A full-stack lead management application for tracking learning centre enquiries across multiple locations.

## Candidate Details

| Field | Value |
|-------|-------|
| **Name** | Vinay Vadlakonda |
| **Candidate Code** | 31716 |
| **Frontend** | React.js (Vite) |
| **Backend** | Node.js + Express |
| **Database** | MySQL (Knex.js) |

## Candidate-Specific Rule

**Rule: Audit Log for Status Changes (last digit 6)** — Every status change on a lead is recorded in a `status_audit_logs` table with old status, new status, who changed it, and why. This provides a complete audit trail for pipeline movements, admin overrides, and auto-advances triggered by follow-up outcomes.

## Screen Recording

[Watch Demo Video (3–5 min)](https://drive.google.com/file/d/1SRGS44TYjMzjDACMx_QZ8CaWYoRNpv9f/view?usp=sharing) — Setup, key flows, validation failure, and code decision walkthrough.

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8+

### Backend

```bash
cd backend
cp .env.example .env   # Configure DB credentials
npm install
npx knex migrate:latest
npx knex seed:run
npm run dev             # Starts on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # Starts on http://localhost:5173
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + DB status |
| **Leads** | | |
| GET | `/api/leads` | List leads (paginated, filtered) |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/:id` | Get single lead + followups |
| PUT | `/api/leads/:id` | Update lead |
| PATCH | `/api/leads/:id/archive` | Archive (soft delete) |
| PATCH | `/api/leads/:id/restore` | Restore archived lead |
| GET | `/api/leads/:id/audit` | Status change audit log |
| **Followups** | | |
| GET | `/api/followups/:leadId` | List followups for a lead |
| POST | `/api/followups/:leadId` | Add followup |
| PUT | `/api/followups/:leadId/:fid` | Update followup |
| DELETE | `/api/followups/:leadId/:fid` | Delete followup |
| **Dashboard** | | |
| GET | `/api/dashboard` | Overview stats |
| GET | `/api/dashboard/by-status` | Leads by status (bar chart) |
| GET | `/api/dashboard/by-centre` | Leads by centre |
| GET | `/api/dashboard/by-owner` | Leads by owner |
| GET | `/api/dashboard/by-source` | Leads by source |
| GET | `/api/dashboard/overdue` | Overdue followup leads |
| **Export** | | |
| GET | `/api/export/leads` | Download leads as CSV |
| **Admin** | | |
| GET | `/api/admin/centres` | List centres |
| GET | `/api/admin/owners` | List owners |
| POST | `/api/admin/centres` | Create centre |
| POST | `/api/admin/owners` | Create owner |
| PATCH | `/api/admin/leads/:id/status` | Override lead status |

### Query Parameters (GET /api/leads)

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Results per page (default: 10, max: 100) |
| `centre_id` | int | Filter by centre |
| `owner_id` | int | Filter by owner |
| `status` | string | Filter by status |
| `source` | string | Filter by source |
| `search` | string | Search name/email/phone |
| `archived` | string | `true` / `false` / `all` |
| `date_from` | ISO date | Filter from date |
| `date_to` | ISO date | Filter to date |

## Database Design

### Tables

- **centres** — 5 learning centres (name, city, address, phone)
- **owners** — 4 team members (name, email, phone, is_admin)
- **leads** — 25 enquiry records (parent/child info, phone, status, timestamps)
- **followups** — Activity log per lead (channel, outcome, notes, next_followup_at)
- **archive_logs** — Archive/restore audit trail
- **status_audit_logs** — Every status change with old/new values, who changed it, and why

### Key Design Decisions

- **Phone normalization**: Strip all non-digits, remove leading zeros, keep last 10 digits. Stored in `phone_normalized` column; compared on normalized form only.
- **Soft delete**: `is_archived` boolean + `archived_at` timestamp. Archived leads hidden from default queries.
- **Closed leads**: Status "Converted" or "Lost" → only `notes` can be edited.
- **Status flow**: New → Contacted → Demo Scheduled → Demo Completed → Converted/Lost (admin can override).
- **Overdue detection**: `next_followup_at < NOW()` flags non-closed leads needing immediate attention.
- **Dates**: MySQL stores UTC (`DATETIME`); Knex inserts/reads raw UTC values. Backend converts UTC → IST via `toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})` for API display. Frontend `formatIST()` applies the same IST conversion. CSV export uses UTC ISO 8601 format.

### Index Rationale

| Table | Index | Why |
|-------|-------|-----|
| leads | `phone_normalized` | Duplicate detection — fast equality lookup |
| leads | `status` | Dashboard GROUP BY + filter |
| leads | `centre_id` | Filter by centre |
| leads | `owner_id` | Filter by owner |
| leads | `is_archived` | Default query excludes archived |
| leads | `next_followup_at` | Overdue detection query |
| leads | `(is_archived, status)` | Composite for dashboard bar chart |
| followups | `lead_id` | Fetch followups per lead |
| followups | `followed_up_at` | Timeline ordering |
| archive_logs | `lead_id` | Audit trail per lead |
| status_audit_logs | `lead_id` | Status history per lead |
| status_audit_logs | `new_status` | Filter by status type |

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Phone normalization — last 10 digits, strip non-digits** | Handles all Indian phone formats (+91, 0-prefix, spaces, dashes). Single normalized column enables fast duplicate lookups. |
| 2 | **Soft delete with restore** | Lost leads may become opportunities again. Archive logs provide audit trail. Restore checks for phone duplicates. |
| 3 | **Knex.js over raw SQL** | Migration system + query builder prevents SQL injection and makes schema version-controlled. |
| 4 | **Closed leads — notes-only editing** | Converted/Lost are final decisions. Full edits would corrupt pipeline data. |
| 5 | **Bar chart for status distribution** | Shows pipeline health at a glance — most important view for the team. |
| 6 | **Status audit log (Rule: 31716)** | Every status change recorded with old/new status, changed by, and reason. Accountability without authentication. |

## Known Limitations

1. **No authentication/authorization** — all endpoints are publicly accessible.
2. **No real-time updates** — dashboard requires manual refresh.
3. **No email/SMS integration** — followup channels tracked manually.
4. **Date filtering is UTC-based** — IST conversion happens at display level only.

## Future Improvements

1. **Role-based access control (RBAC)** — admin, centre lead, viewer permissions.
2. **Automated followup reminders** — email/SMS for overdue followups.
3. **Lead scoring** — algorithmic prioritization based on engagement signals.
4. **Conversion analytics dashboard** — conversion rates, time-to-convert, owner trends.

## AI Usage Note:

Approximately **30% of this project** was developed with the assistance of **ChatGPT**. AI was used for:
- Project scaffolding and boilerplate generation
- Database schema review and migration structure
- Code review and bug fix suggestions
- Test case design patterns

All AI-assisted code was reviewed, tested, and verified manually before committing.

## GitHub

Repository: [github.com/vinayvadlakondagoud/centre-lead-tracker](https://github.com/vinayvadlakondagoud/centre-lead-tracker)
