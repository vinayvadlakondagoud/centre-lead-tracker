# Centre Lead Tracker

A full-stack lead management application for tracking learning centre enquiries across multiple locations.

## Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** MySQL (via Knex.js)
- **Validation:** express-validator
- **CSV Export:** json2csv
- **Testing:** Vitest + React Testing Library (frontend), Node.js test runner (backend)

## Candidate Code: 31716

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
- **owners** — 4 centre leads/owners (name, email, phone, is_admin)
- **leads** — Enquiry records (parent/child info, phone, status, timestamps)
- **followups** — Activity log per lead (channel, outcome, notes, next_followup_at)
- **archive_logs** — Audit trail for archive/restore actions
- **status_audit_logs** — Every status change with old/new values, who changed it, and why

### Key Design Decisions

- **Phone normalization**: Strip all non-digits, remove leading zeros, keep last 10 digits. Stored in `phone_normalized` column; compared on normalized form only.
- **Soft delete**: `is_archived` boolean + `archived_at` timestamp. Archived leads hidden from default queries.
- **Closed leads**: Status "Converted" or "Lost" → only `notes` can be edited.
- **Status flow**: New → Contacted → Demo Scheduled → Demo Completed → Converted/Lost (admin can override).
- **Overdue detection**: `next_followup_at < NOW()` flags non-closed leads needing immediate attention.
- **Dates**: MySQL stores UTC (`DATETIME`); Knex inserts/reads raw UTC values. Backend utility `dates.js` converts UTC → IST via `toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})` for API display. Frontend `formatIST()` applies the same IST conversion for UI rendering. CSV export uses raw `new Date().toISOString()` (UTC ISO 8601) so spreadsheet apps can localise on import.

### Index Rationale

| Table | Index | Why |
|-------|-------|-----|
| leads | `phone_normalized` | Duplicate detection on create/update — must be fast equality lookup |
| leads | `status` | Dashboard GROUP BY status + filter by status on list page |
| leads | `centre_id` | Filter leads by centre (list page + dashboard) |
| leads | `owner_id` | Filter leads by owner (list page + dashboard) |
| leads | `is_archived` | Default query excludes archived; archived page shows only archived |
| leads | `next_followup_at` | Overdue followup query: `WHERE next_followup_at < NOW()` |
| leads | `(is_archived, status)` | Composite for dashboard status bar chart (always filters both) |
| followups | `lead_id` | Fetch followups for a lead — most frequent query pattern |
| followups | `followed_up_at` | Timeline ordering: `ORDER BY followed_up_at DESC` |
| archive_logs | `lead_id` | Audit trail lookup per lead |
| status_audit_logs | `lead_id` | Status history per lead — most common query pattern |
| status_audit_logs | `new_status` | Filter by status type in audit queries |

## Decision Log

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Phone normalization — last 10 digits, strip non-digits** | Handles all Indian phone formats (+91, 0-prefix, spaces, dashes). Single normalized column enables fast duplicate lookups via simple equality check. |
| 2 | **Soft delete with restore (Rule: C001)** | Lost leads may become opportunities again. Archive logs provide audit trail. Restore checks for phone duplicates before allowing restoration. |
| 3 | **Knex.js over raw SQL queries** | Migration system + query builder reduces boilerplate, prevents SQL injection, and makes schema version-controlled. Knex is lightweight enough for this project's scale. |
| 4 | **Closed leads — notes-only editing** | Converted/Lost leads represent final decisions. Allowing full edits would corrupt pipeline data. Notes-only keeps communication history editable while preserving data integrity. |
| 5 | **Bar chart for status distribution** | Shows pipeline health at a glance — most important dashboard view for a centre lead tracking team. |
| 6 | **Status audit log (Rule: 31716 — last digit 6)** | Every status change is recorded with old/new status, who changed it, and why. Covers manual updates, admin overrides, and auto-advances from follow-up outcomes. Provides accountability without requiring authentication. |

## AI Usage Note

This project was built with the assistance of AI (Claude by Anthropic). AI was used for:
- Initial project scaffolding and boilerplate generation
- Database schema design review and validation
- Code review, bug detection, and fix suggestions
- Test case design and assertion patterns
- Documentation structure and content

One suggestion rejected: AI suggested adding JWT authentication from the start. I chose to leave auth out of the MVP scope to focus on core lead management flows, documenting it as a known limitation instead.

All code was reviewed, tested, and verified manually before committing.

## Known Limitations

1. **No authentication/authorization** — all endpoints are publicly accessible. In production, JWT or session-based auth would be required.
2. **No real-time updates** — dashboard and lead lists require manual refresh. WebSocket support could add live updates.
3. **No email/SMS integration** — followup channels are tracked manually. Integration with Twilio/SendGrid could automate outreach.
4. **No file uploads** — notes are text-only. Supporting document attachments (e.g., signed enrollment forms) would require file storage.
5. **No multi-tenancy** — single database serves all centres. A SaaS version would need tenant isolation.
6. **Date filtering is UTC-based** — MySQL stores datetimes in UTC. IST conversion happens at display level only.

## Future Improvements

1. **Role-based access control (RBAC)** — differentiate admin, centre lead, and viewer permissions.
2. **Automated followup reminders** — email/SMS notifications for overdue followups.
3. **Lead scoring** — algorithmic prioritization based on engagement signals.
4. **Bulk operations** — CSV import, bulk status updates, bulk archive/restore.
5. **Analytics dashboard** — conversion rates, average time-to-convert, owner performance trends.
6. **Activity timeline** — chronological feed of all actions across leads.
7. **Mobile responsive PWA** — installable on phones for field staff.
