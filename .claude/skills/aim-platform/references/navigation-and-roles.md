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
| Nudges | Individual-level self-report micro-surveys tied to Goals/Workflows — pushed organically to Slack/Teams, not just answerable on-site; admin tab shows delivery stats + a manual "Send now" | superadmin, hradmin |
| Integrations | Connector registry — Connect/Disconnect buttons per vendor, both notification delivery (Slack, Teams — real) and metrics-sync (Tier 2/3 — still no vendor chosen) | superadmin only |
| Reports | Org / department / individual drill-down | All roles |
| Teams | User directory, role management | superadmin, hradmin |
| Config | Thresholds, feature flags, privacy | superadmin only |

**Roles:** `superadmin`, `hradmin`, `manager`, `viewer`.

Real auth is Supabase Auth: email/password (hashed) plus vendor-agnostic
enterprise SSO (`signInWithSSO({ domain })`, resolving to whatever SAML/
OIDC identity provider each enterprise registers for their own domain —
Okta, Entra ID, OneLogin, etc.), plus Microsoft OAuth as a separate
convenience sign-in. **Deliberately no Google** — explicit client steer
that many enterprises avoid it. See `references/engineering.md` for how
this was built and `references/open-decisions-and-artifacts.md` for the
now-resolved auth-approach decision.

Note: edit permissions (as opposed to view/nav access) for the Workflows and
Transformation Goals tabs are explicitly undefined — don't assume a role
can edit just because it can view. See the Open Decisions Log.
