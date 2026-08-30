# Information Architecture / Navigation

Mirrors PRD §3. Full text: `docs/PRD-Engineering-Framework.md`.

Top-level tabs (peers, not nested):

| Tab | Purpose | Role access |
|---|---|---|
| Take Assessment | Respondent-facing survey flow (pre/post) | All roles |
| Overview (Dashboard) | Org-wide readiness stats, adoption curve | All roles |
| Assessment Builder | Author/edit questions, dimensions, scoring rubrics | superadmin, hradmin |
| Scoring Engine | Read-only view of cut-score rules and thresholds | superadmin, hradmin, manager |
| Workflows | Kanban: Identified → Augmented → Piloting → Standard | All roles (edit: TBD by role) |
| Interventions | Plan training moments, casual collisions, sustainment sessions, role-based trainings | superadmin, hradmin |
| Transformation Goals | ROI Measurability Ladder, goal authoring, objective picker | All roles (edit: TBD by role) |
| Nudges | **Not yet built.** Individual-level self-report micro-surveys tied to Goals/Workflows | superadmin, hradmin |
| Integrations | **Not yet built.** Connector registry — OAuth connect buttons per vendor | superadmin only |
| Reports | Org / department / individual drill-down | All roles |
| Teams | User directory, role management | superadmin, hradmin |
| Config | Thresholds, feature flags, privacy | superadmin only |

**Roles:** `superadmin`, `hradmin`, `manager`, `viewer`.

Current prototype auth is email + plaintext passcode in shared storage —
**explicitly flagged as demo-only, not production-secure.** Real auth
(hashed credentials or SSO) is required before any real user data touches
this system. See `references/engineering.md` for the migration plan and
`references/open-decisions-and-artifacts.md` for the unresolved
auth-approach question.

Note: edit permissions (as opposed to view/nav access) for the Workflows and
Transformation Goals tabs are explicitly undefined — don't assume a role
can edit just because it can view. See the Open Decisions Log.
