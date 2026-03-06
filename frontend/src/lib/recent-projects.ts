export interface RecentProject {
  path: string;
  name: string;
  lastAccessed: number;
}

const STORAGE_KEY = "recentProjects";
const MAX_PROJECTS = 10;

export function loadRecentProjects(): RecentProject[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const projects = JSON.parse(stored) as RecentProject[];
    return projects.sort((a, b) => b.lastAccessed - a.lastAccessed).slice(0, MAX_PROJECTS);
  } catch {
    return [];
  }
}

export function saveRecentProject(path: string, name: string): RecentProject[] {
  const existing = loadRecentProjects().filter((p) => p.path !== path);
  const updated = [{ path, name, lastAccessed: Date.now() }, ...existing].slice(0, MAX_PROJECTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeRecentProject(path: string): RecentProject[] {
  const updated = loadRecentProjects().filter((p) => p.path !== path);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
