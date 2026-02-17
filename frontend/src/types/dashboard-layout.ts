export type DashboardLayoutMode = "comfortable" | "classic";

export const DASHBOARD_LAYOUT_STORAGE_KEY = "dashboard:layout-mode";

export function parseDashboardLayoutMode(value: string | null): DashboardLayoutMode {
  return value === "classic" ? "classic" : "comfortable";
}
