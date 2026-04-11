"use client";

import categoriesData from "@/data/categories.json";
import sectionsData from "@/data/sections.json";
import modulesData from "@/data/modules.json";
import type { ToolCategory, ContentSection, Module, ToolItem } from "@/shared/types";

// ─── Storage Keys ────────────────────────────────────────────────────────────

const KEYS = {
  USERS: "vortex_users",
  AUTH: "vortex_auth",
  CATEGORIES: "vortex_categories",
  SECTIONS: "vortex_sections",
  MODULES: "vortex_modules",
  TEAM_SPINE: "vortex_team_spine",
  TEAMS: "vortex_teams",
  TEAM_DRIVE: "vortex_team_drive",
  VORTEX_PAGE: "vortex_page_data",
  NOTIFICATIONS: "vortex_notifications",
  CANVAS_POSITIONS: "vortex_canvas_positions",
  VIEWER_PERMISSIONS: "vortex_viewer_permissions",
  SEEDED: "vortex_seeded",
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "editor" | "viewer";

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface ViewerPermissions {
  userId: string;
  allowedPages: string[];
}

export interface Notification {
  id: string;
  page: string;
  changeType: "add" | "edit" | "delete";
  itemName: string;
  timestamp: string;
  username: string;
  read: boolean;
}

export interface SpineMember {
  name: string;
  role: string;
  img: string;
}

export interface TeamMemberData {
  name: string;
  img: string;
}

export interface TeamData {
  id: number;
  label: string;
  head: TeamMemberData;
  tls: TeamMemberData[];
  atls: TeamMemberData[];
  engineers: TeamMemberData[];
}

export interface TeamDriveCategory {
  id: string;
  title: string;
  items: TeamDriveItem[];
}

export interface TeamDriveItem {
  id: string;
  label: string;
  url: string;
  urlType: "url" | "gurl" | "yurl";
}

export interface VortexPageData {
  background: { type: "image" | "video" | "color" | "gradient"; value: string };
  heroTitle: string;
  heroSubtitle: string;
  categories: { title: string; items: string[] }[];
  credits: { name: string; role: string }[];
}

export interface CanvasPosition {
  pageId: string;
  itemId: string;
  x: number;
  y: number;
  order: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ─── Default Data for Seeding ────────────────────────────────────────────────

const DEFAULT_SPINE: SpineMember[] = [
  { name: "Yoke Kong Seow", role: "Network Technical", img: "/placeholder.jpg" },
  { name: "Cristino Crisostomo", role: "Network Operations and Assurance", img: "/placeholder.jpg" },
  { name: "Matthew Slee", role: "Tier 1 Operations", img: "/placeholder.jpg" },
  { name: "Aliver Dimacisil", role: "Head — DSOC", img: "/placeholder.jpg" },
  { name: "Neil Chester Soria", role: "Head — NASA", img: "/placeholder.jpg" },
];

const DEFAULT_TEAMS: TeamData[] = [
  {
    id: 1, label: "NASA Team 1",
    head: { name: "Girlie Quitalig", img: "/placeholder.jpg" },
    tls: [
      { name: "Catherine Eustaquio", img: "/placeholder.jpg" },
      { name: "Jerome Quirona", img: "/placeholder.jpg" },
    ],
    atls: [
      { name: "Charisa Laguna", img: "/placeholder.jpg" },
      { name: "Charisse Ortiz Luis-Formoso", img: "/placeholder.jpg" },
    ],
    engineers: [
      { name: "Rose Marie Arvesu Bacalzo", img: "/placeholder.jpg" },
      { name: "Precious Regina Breto", img: "/placeholder.jpg" },
      { name: "Ma. Ellarie Ann Alday", img: "/placeholder.jpg" },
      { name: "Jose H. Montenegro V", img: "/placeholder.jpg" },
      { name: "Mc Genesis Blazo", img: "/placeholder.jpg" },
      { name: "Ronico Cunanan", img: "/placeholder.jpg" },
    ],
  },
  {
    id: 2, label: "NASA Team 2",
    head: { name: "Armilene Marquez", img: "/placeholder.jpg" },
    tls: [
      { name: "Gilbert Reyes", img: "/placeholder.jpg" },
      { name: "Fernand Loretizo", img: "/placeholder.jpg" },
    ],
    atls: [
      { name: "Mary Grace Bautista", img: "/placeholder.jpg" },
      { name: "Laarni Marquez", img: "/placeholder.jpg" },
    ],
    engineers: [
      { name: "Danilo Ricafrente", img: "/placeholder.jpg" },
      { name: "Jeizel Concepcion", img: "/placeholder.jpg" },
      { name: "Bryan Gervacio Bolivar", img: "/placeholder.jpg" },
      { name: "Rachel Ann Caigas", img: "/placeholder.jpg" },
      { name: "Fressie Ritz Gosilatar", img: "/placeholder.jpg" },
      { name: "Mary Grace Silfavan", img: "/placeholder.jpg" },
    ],
  },
];

const DEFAULT_TEAM_DRIVE: TeamDriveCategory[] = [
  {
    id: "scripts", title: "SCRIPTS:",
    items: [
      { id: "s1", label: "NEW 2G Integration", url: "https://drive.google.com/drive/folders/1XWoy0a6zGIrOyCnEB81W0JEFWkIjb03Z", urlType: "url" },
      { id: "s2", label: "IPCLOCK", url: "#", urlType: "url" },
      { id: "s3", label: "NEW 3G Integration", url: "#", urlType: "url" },
      { id: "s4", label: "NEIGHBOR", url: "#", urlType: "url" },
      { id: "s5", label: "NEW EM Integration", url: "#", urlType: "url" },
      { id: "s6", label: "HT CORE SCRIPT", url: "#", urlType: "url" },
      { id: "s7", label: "NEW AC Integration", url: "#", urlType: "url" },
      { id: "s8", label: "LTE 3 VLANS SCRIPT", url: "#", urlType: "url" },
      { id: "s9", label: "NEW PC Integration", url: "#", urlType: "url" },
      { id: "s10", label: "Project Calibre", url: "#", urlType: "url" },
      { id: "s11", label: "OMU SCRIPT", url: "#", urlType: "url" },
      { id: "s12", label: "IP MIGRATION SCRIPT", url: "#", urlType: "url" },
    ],
  },
  {
    id: "sheets", title: "SHEETS:",
    items: [
      { id: "sh1", label: "4G TRFS_CRFS", url: "#", urlType: "gurl" },
      { id: "sh2", label: "Integration Tracker [RIT]", url: "#", urlType: "gurl" },
      { id: "sh3", label: "RAN Engr Scheduler", url: "#", urlType: "gurl" },
      { id: "sh4", label: "Troubleshooting Logs [RATL]", url: "#", urlType: "gurl" },
      { id: "sh5", label: "LTE IP ROUTES", url: "#", urlType: "gurl" },
      { id: "sh6", label: "Integration Updates", url: "#", urlType: "gurl" },
    ],
  },
  {
    id: "slides", title: "SLIDES:",
    items: [
      { id: "sl1", label: "Project Vortex", url: "#", urlType: "gurl" },
      { id: "sl2", label: "DIY PicoBTS INTEGRATION", url: "#", urlType: "gurl" },
      { id: "sl3", label: "Nokia MML & Alarms", url: "#", urlType: "gurl" },
      { id: "sl4", label: "RET ACTIVATION", url: "#", urlType: "gurl" },
    ],
  },
];

const DEFAULT_VORTEX: VortexPageData = {
  background: { type: "video", value: "/laserflow.webm" },
  heroTitle: "WHAT'S INSIDE THE VORTEX",
  heroSubtitle: "Scroll down to enter the core modules, operational references, and structural depths of the portal.",
  categories: [
    { title: "HOME", items: ["Activity Tracker", "RAN Hotlines", "NOC Web Tools", "NOC Shift Handover"] },
    { title: "RAN REPORT", items: ["Official Network Count per PLA", "NE Count per BSC/RNC per REGION", "Site/Cell configuration parameters"] },
    { title: "THE TEAM", items: ["RAN Engineers", "TEAM DRIVE (Exclusive for NOC RAN use only)", "Inside VORTEX"] },
    { title: "KNOW MORE", items: ["Videos / Slides / Chart Presentations"] },
    { title: "TRACKER", items: ["For newly integrated sites", "TRFS and CRFS Dates", "Site count per year"] },
    { title: "ALARM LIBRARY", items: ["Alarm troubleshooting guide"] },
  ],
  credits: [
    { name: "JEROME, Admin 1", role: "Vortex Updates, Trackers" },
    { name: "JHOANNA, Admin 2", role: "TeamDrive, Scripts, Survey" },
    { name: "JONARD, Admin 3", role: "RAN Report" },
    { name: "ANNA, PPM Documentation", role: "Alarm Library, PPM Documentations" },
    { name: "GUS, PPM Documentation", role: "PPM Documentations" },
    { name: "SETTE, PPM Documentation", role: "PPM Documentations" },
    { name: "REZIEL, RAN Report Update", role: "Group List Updates" },
    { name: "NICO, NE Listing", role: "List of NEs per BSC/RNC" },
    { name: "ARMI, PPM TL", role: "PPM TL Approver" },
    { name: "MYLA, PPM TL", role: "PPM TL Approver" },
    { name: "PAU, Knowledge Management", role: "NTG Contacts Directory, Know More Presentations" },
    { name: "GRACE, Knowledge Management", role: "PPM Documentations, Know More Presentations" },
    { name: "ELAINE, Knowledge Management", role: "KnowMore Presentations" },
    { name: "FERNAND, Tracker QA", role: "TRFS Tracker Checker" },
    { name: "GILBERT, Monitoring", role: "SLCK/MODIF Monitoring" },
    { name: "EDH, RAN Report Update", role: "Site Report Updates" },
  ],
};

// ─── Initialize / Seed ───────────────────────────────────────────────────────

export function seedIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.SEEDED)) return;

  // Default admin account
  const defaultUsers: UserAccount[] = [
    { id: "admin-default", username: "admin", password: "harveybuan123", displayName: "Administrator", role: "admin" },
  ];
  setItem(KEYS.USERS, defaultUsers);
  setItem(KEYS.CATEGORIES, categoriesData);
  setItem(KEYS.SECTIONS, sectionsData);
  setItem(KEYS.MODULES, modulesData);
  setItem(KEYS.TEAM_SPINE, DEFAULT_SPINE);
  setItem(KEYS.TEAMS, DEFAULT_TEAMS);
  setItem(KEYS.TEAM_DRIVE, DEFAULT_TEAM_DRIVE);
  setItem(KEYS.VORTEX_PAGE, DEFAULT_VORTEX);
  setItem(KEYS.NOTIFICATIONS, []);
  setItem(KEYS.CANVAS_POSITIONS, []);
  setItem(KEYS.VIEWER_PERMISSIONS, []);

  localStorage.setItem(KEYS.SEEDED, "true");
}

// ─── User / Auth Operations ──────────────────────────────────────────────────

export function getUsers(): UserAccount[] {
  return getItem<UserAccount[]>(KEYS.USERS, []);
}

export function saveUsers(users: UserAccount[]): void {
  setItem(KEYS.USERS, users);
}

export function authenticate(username: string, password: string): UserAccount | null {
  const users = getUsers();
  return users.find((u) => u.username === username && u.password === password) || null;
}

export function getCurrentUser(): UserAccount | null {
  return getItem<UserAccount | null>(KEYS.AUTH, null);
}

export function setCurrentUser(user: UserAccount | null): void {
  setItem(KEYS.AUTH, user);
}

export function createUser(user: Omit<UserAccount, "id">): UserAccount {
  const users = getUsers();
  const newUser: UserAccount = { ...user, id: generateId() };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<Omit<UserAccount, "id">>): void {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    // If updating current user, refresh auth
    const current = getCurrentUser();
    if (current && current.id === id) {
      setCurrentUser(users[idx]);
    }
  }
}

export function deleteUser(id: string): void {
  const users = getUsers().filter((u) => u.id !== id);
  saveUsers(users);
  // Also remove viewer permissions
  const perms = getViewerPermissions().filter((p) => p.userId !== id);
  setItem(KEYS.VIEWER_PERMISSIONS, perms);
}

// ─── Viewer Permissions ──────────────────────────────────────────────────────

export function getViewerPermissions(): ViewerPermissions[] {
  return getItem<ViewerPermissions[]>(KEYS.VIEWER_PERMISSIONS, []);
}

export function setViewerPagePermissions(userId: string, allowedPages: string[]): void {
  const perms = getViewerPermissions().filter((p) => p.userId !== userId);
  perms.push({ userId, allowedPages });
  setItem(KEYS.VIEWER_PERMISSIONS, perms);
}

export function getViewerAllowedPages(userId: string): string[] | null {
  const perm = getViewerPermissions().find((p) => p.userId === userId);
  return perm ? perm.allowedPages : null;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function getNotifications(): Notification[] {
  return getItem<Notification[]>(KEYS.NOTIFICATIONS, []);
}

export function addNotification(n: Omit<Notification, "id" | "read">): void {
  const notifications = getNotifications();
  notifications.unshift({ ...n, id: generateId(), read: false });
  setItem(KEYS.NOTIFICATIONS, notifications);
}

export function markNotificationRead(id: string): void {
  const notifications = getNotifications();
  const n = notifications.find((x) => x.id === id);
  if (n) n.read = true;
  setItem(KEYS.NOTIFICATIONS, notifications);
}

export function markAllNotificationsRead(): void {
  const notifications = getNotifications().map((n) => ({ ...n, read: true }));
  setItem(KEYS.NOTIFICATIONS, notifications);
}

export function clearNotifications(): void {
  setItem(KEYS.NOTIFICATIONS, []);
}

// ─── Categories (Home Page Tools) ────────────────────────────────────────────

export function getCategories(): ToolCategory[] {
  return getItem<ToolCategory[]>(KEYS.CATEGORIES, categoriesData as ToolCategory[]);
}

export function saveCategories(categories: ToolCategory[]): void {
  setItem(KEYS.CATEGORIES, categories);
}

export function getCategoriesByParentLS(parentSlug: string): ToolCategory[] {
  return getCategories()
    .filter((c) => c.parentSlug === parentSlug)
    .sort((a, b) => a.order - b.order);
}

export function addCategory(category: ToolCategory): void {
  const cats = getCategories();
  cats.push(category);
  saveCategories(cats);
}

export function updateCategory(slug: string, updates: Partial<ToolCategory>): void {
  const cats = getCategories();
  const idx = cats.findIndex((c) => c.slug === slug);
  if (idx >= 0) {
    cats[idx] = { ...cats[idx], ...updates };
    saveCategories(cats);
  }
}

export function deleteCategory(slug: string): void {
  saveCategories(getCategories().filter((c) => c.slug !== slug));
}

export function addToolToCategory(categorySlug: string, tool: ToolItem): void {
  const cats = getCategories();
  const cat = cats.find((c) => c.slug === categorySlug);
  if (cat) {
    cat.tools.push(tool);
    saveCategories(cats);
  }
}

export function updateToolInCategory(categorySlug: string, toolSlug: string, updates: Partial<ToolItem>): void {
  const cats = getCategories();
  const cat = cats.find((c) => c.slug === categorySlug);
  if (cat) {
    const idx = cat.tools.findIndex((t) => t.slug === toolSlug);
    if (idx >= 0) {
      cat.tools[idx] = { ...cat.tools[idx], ...updates };
      saveCategories(cats);
    }
  }
}

export function deleteToolFromCategory(categorySlug: string, toolSlug: string): void {
  const cats = getCategories();
  const cat = cats.find((c) => c.slug === categorySlug);
  if (cat) {
    cat.tools = cat.tools.filter((t) => t.slug !== toolSlug);
    saveCategories(cats);
  }
}

export function getAllToolsLS(): ToolItem[] {
  return getCategories().flatMap((c) => c.tools.sort((a, b) => a.order - b.order));
}

// ─── Sections (Know More, Reports, etc.) ─────────────────────────────────────

export function getSections(): ContentSection[] {
  return getItem<ContentSection[]>(KEYS.SECTIONS, sectionsData as ContentSection[]);
}

export function saveSections(sections: ContentSection[]): void {
  setItem(KEYS.SECTIONS, sections);
}

export function getSectionsByParentLS(parentSlug: string): ContentSection[] {
  return getSections()
    .filter((s) => s.parentSlug === parentSlug)
    .sort((a, b) => a.order - b.order);
}

export function getSectionBySlugLS(slug: string): ContentSection | undefined {
  return getSections().find((s) => s.slug === slug);
}

export function getAllSectionsLS(): ContentSection[] {
  return getSections().sort((a, b) => a.order - b.order);
}

export function addSection(section: ContentSection): void {
  const sections = getSections();
  sections.push(section);
  saveSections(sections);
}

export function updateSection(slug: string, updates: Partial<ContentSection>): void {
  const sections = getSections();
  const idx = sections.findIndex((s) => s.slug === slug);
  if (idx >= 0) {
    sections[idx] = { ...sections[idx], ...updates };
    saveSections(sections);
  }
}

export function deleteSection(slug: string): void {
  saveSections(getSections().filter((s) => s.slug !== slug));
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export function getModulesLS(): Module[] {
  return getItem<Module[]>(KEYS.MODULES, modulesData as Module[]).sort((a, b) => a.order - b.order);
}

// ─── Team Data ───────────────────────────────────────────────────────────────

export function getTeamSpine(): SpineMember[] {
  return getItem<SpineMember[]>(KEYS.TEAM_SPINE, DEFAULT_SPINE);
}

export function saveTeamSpine(spine: SpineMember[]): void {
  setItem(KEYS.TEAM_SPINE, spine);
}

export function getTeams(): TeamData[] {
  return getItem<TeamData[]>(KEYS.TEAMS, DEFAULT_TEAMS);
}

export function saveTeams(teams: TeamData[]): void {
  setItem(KEYS.TEAMS, teams);
}

// ─── Team Drive ──────────────────────────────────────────────────────────────

export function getTeamDrive(): TeamDriveCategory[] {
  return getItem<TeamDriveCategory[]>(KEYS.TEAM_DRIVE, DEFAULT_TEAM_DRIVE);
}

export function saveTeamDrive(drive: TeamDriveCategory[]): void {
  setItem(KEYS.TEAM_DRIVE, drive);
}

// ─── Vortex Page ─────────────────────────────────────────────────────────────

export function getVortexPageData(): VortexPageData {
  return getItem<VortexPageData>(KEYS.VORTEX_PAGE, DEFAULT_VORTEX);
}

export function saveVortexPageData(data: VortexPageData): void {
  setItem(KEYS.VORTEX_PAGE, data);
}

// ─── Canvas Positions ────────────────────────────────────────────────────────

export function getCanvasPositions(pageId: string): CanvasPosition[] {
  return getItem<CanvasPosition[]>(KEYS.CANVAS_POSITIONS, []).filter((p) => p.pageId === pageId);
}

export function saveCanvasPositions(pageId: string, positions: CanvasPosition[]): void {
  const all = getItem<CanvasPosition[]>(KEYS.CANVAS_POSITIONS, []).filter((p) => p.pageId !== pageId);
  all.push(...positions);
  setItem(KEYS.CANVAS_POSITIONS, all);
}

// ─── Export generateId for use in components ─────────────────────────────────

export { generateId };
