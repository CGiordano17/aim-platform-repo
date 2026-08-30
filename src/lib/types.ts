// Shared TypeScript types mirroring docs/PRD-Engineering-Framework.md §4.
// Keep this file, the PRD, and supabase/migrations in sync — see the
// aim-platform skill's references/data-models.md.

export type AppRole = "superadmin" | "hradmin" | "manager" | "viewer";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  department: string | null;
}

export interface Question {
  id: string;
  code: string;
  dimension: string;
  text: string;
  type: "likert" | "multiple_choice" | "text";
  phase: "pre" | "post" | "both";
  options?: string[] | null;
  optionScores?: number[] | null;
  scoringPrompt?: string | null;
  required: boolean;
}

export interface DimensionScores {
  trust: number;
  willingness: number;
  prepFoundations: number;
  prepWorkflow: number;
  prepTech: number;
  overall: number;
  custom?: Record<string, number>;
}

export interface Respondent {
  id: string;
  profileId?: string | null;
  name: string;
  department: string | null;
  role: string | null;
  level: string | null;
  preScore: DimensionScores;
  postScore?: DimensionScores | null;
  preSegment: string | null;
  postSegment?: string | null;
  pathway: string | null;
  completedPre: boolean;
  completedPost: boolean;
}

export interface WorkflowTask {
  id: string;
  name: string;
  aiAugmented: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  department: string | null;
  owner: string | null;
  tasks: WorkflowTask[];
  status: "identified" | "augmented" | "piloting" | "standard";
  usageRate?: number | null;
  adoptionThreshold?: number | null;
  complianceRate?: number | null;
  linkedGoalIds: string[];
  dateIdentified?: string | null;
  dateAugmented?: string | null;
  dateScaled?: string | null;
}

export interface Intervention {
  id: string;
  type: "training_moment" | "casual_collision" | "sustainment_session" | "role_based_training";
  format: "virtual" | "in_person";
  title: string;
  description: string | null;
  date: string | null;
  linkedWorkflowIds: string[];
  linkedDepartment?: string | null;
  participants: string[];
  status: "planned" | "completed";
  facilitator: string | null;
}

// GoalCategory / GoalTier / GoalMaturity: see PRD §2.4. `maturity` was added
// to this schema alongside the phase-5 migration — PRD §4 previously omitted
// it despite §2.4 requiring it on every card.
export type GoalCategory = "productivity" | "quality" | "revenue" | "capability";
export type GoalTier = 0 | 1 | 2 | 3;
export type GoalMaturity = "literate" | "applied" | "operational" | "transformational";
export type GoalMeasurementSource = "nudge" | "manual" | "vendor_api" | "system_api";

export interface GoalStatementParts {
  action: string;
  resources: string;
  outcome: string;
}

export interface GoalVendorSource {
  name: string;
  notes: string;
}

export interface GoalImplementationStep {
  title: string;
  detail: string;
}

export interface TransformationGoal {
  id: string;
  title: string;
  category: GoalCategory;
  tier: GoalTier;
  maturity: GoalMaturity;
  statement: GoalStatementParts;
  measurementSource: GoalMeasurementSource;
  measures?: string | null;
  sourceDetail?: string | null;
  currentValue: string | null;
  targetValue?: string | null;
  unit?: string | null;
  linkedWorkflowIds: string[];
  linkedNudgeIds: string[];
  vendorSources?: GoalVendorSource[];
  implementationSteps?: GoalImplementationStep[];
  roiExample?: string | null;
  lastUpdated?: string | null;
  updatedBy?: string | null;
}

// Nudge / Integration: PRD §4 marks both "not yet built" as features. Types
// and schema are reserved ahead of build phases 3 and 6 respectively.
export interface Nudge {
  id: string;
  questionText: string;
  linkedGoalId?: string | null;
  cadence: "per-completion" | "weekly" | "monthly";
  targetDepartment?: string | null;
  targetRole?: string | null;
  targetIndividualIds: string[];
}

export interface NudgeResponse {
  id: string;
  nudgeId: string;
  respondentId?: string | null;
  value: string;
  respondedAt: string;
}

export interface Integration {
  id: string;
  vendorName: string;
  authType: "oauth";
  status: "connected" | "disconnected";
  scopes: string[];
  connectedAt?: string | null;
  lastSync?: string | null;
  syncedMetrics: string[];
}
