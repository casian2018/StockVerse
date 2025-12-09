export type AutomationTriggerType = "kpi" | "date";
export type AutomationActionType = "alert" | "task" | "email";

export type AutomationComparator = "above" | "below" | "equals";

export const KPI_METRICS = [
  { id: "overdue_tasks", label: "Overdue tasks" },
  { id: "completion_rate", label: "Task completion rate (%)" },
  { id: "headcount", label: "Team headcount" },
  { id: "upcoming_birthdays", label: "Upcoming birthdays (14d)" },
] as const;

export const DATE_FIELDS = [
  { id: "startDate", label: "Employment start date" },
  { id: "birthDate", label: "Birth date" },
] as const;

export const ROLES = ["Admin", "Manager", "Guest"] as const;

export interface AutomationTrigger {
  type: AutomationTriggerType;
  metricId?: (typeof KPI_METRICS)[number]["id"];
  comparator?: AutomationComparator;
  threshold?: number;
  dateField?: (typeof DATE_FIELDS)[number]["id"];
  offsetDays?: number;
}

export interface AutomationAction {
  type: AutomationActionType;
  title?: string;
  message?: string;
  task?: {
    title: string;
    description?: string;
    deadlineOffsetDays?: number;
    priority?: "Low" | "Medium" | "High" | "Urgent";
  };
  email?: {
    subject: string;
    body: string;
  };
}

export interface Automation {
  _id?: string;
  business: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  visibilityRoles: string[];
  ownerEmail: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: string;
}

export interface AutomationAlert {
  _id?: string;
  automationId: string;
  business: string;
  message: string;
  createdAt: string;
  roles: string[];
  action: AutomationAction;
  readBy: string[];
  metadata?: Record<string, unknown>;
  read?: boolean;
}
