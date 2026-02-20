export type DashboardLayoutMode = "comfortable";

export const DASHBOARD_LAYOUT_STORAGE_KEY = "dashboard:layout-mode";

export function parseDashboardLayoutMode(value: string | null): DashboardLayoutMode {
  return "comfortable";
}
