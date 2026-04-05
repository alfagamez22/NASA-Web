import { config } from "dotenv";
config({ path: ".env.local" });
config(); // fallback to .env

import { PrismaClient, UserRole, MediaType, TeamMemberRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── JSON Data Imports ───────────────────────────────────────────────────────

import categoriesData from "../src/data/categories.json";
import sectionsData from "../src/data/sections.json";
import modulesData from "../src/data/modules.json";

// ─── Default Data (matches data-store.ts) ────────────────────────────────────

const DEFAULT_SPINE = [
  { name: "Yoke Kong Seow", role: "Network Technical", img: "/placeholder.jpg", order: 0 },
  { name: "Cristino Crisostomo", role: "Network Operations and Assurance", img: "/placeholder.jpg", order: 1 },
  { name: "Matthew Slee", role: "Tier 1 Operations", img: "/placeholder.jpg", order: 2 },
  { name: "Aliver Dimacisil", role: "Head — DSOC", img: "/placeholder.jpg", order: 3 },
  { name: "Neil Chester Soria", role: "Head — NASA", img: "/placeholder.jpg", order: 4 },
];

interface SeedTeam {
  id: number;
  label: string;
  head: { name: string; img: string };
  tls: { name: string; img: string }[];
  atls: { name: string; img: string }[];
  engineers: { name: string; img: string }[];
}

const DEFAULT_TEAMS: SeedTeam[] = [
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

interface SeedDriveItem {
  id: string;
  label: string;
  url: string;
  urlType: string;
}

interface SeedDriveCategory {
  id: string;
  title: string;
  items: SeedDriveItem[];
}

const DEFAULT_TEAM_DRIVE: SeedDriveCategory[] = [
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

const DEFAULT_VORTEX = {
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

// ─── Media type mapper ───────────────────────────────────────────────────────

function toMediaType(t: string): MediaType {
  switch (t) {
    case "google-slides": return "google_slides";
    case "youtube": return "youtube";
    case "image": return "image";
    case "iframe": return "iframe";
    default: return "image";
  }
}

// ─── Main Seed ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── 1. Admin user ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("harveybuan123", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      displayName: "Administrator",
      role: "admin",
    },
  });
  console.log(`✓ Admin user: ${admin.username} (${admin.id})`);

  // ── 2. Tool Categories & Tools ─────────────────────────────────────────────
  for (const cat of categoriesData) {
    await prisma.toolCategory.upsert({
      where: { slug: cat.slug },
      update: { title: cat.title, parentSlug: cat.parentSlug, order: cat.order },
      create: {
        slug: cat.slug,
        title: cat.title,
        parentSlug: cat.parentSlug,
        order: cat.order,
      },
    });

    for (const tool of cat.tools) {
      await prisma.tool.upsert({
        where: { slug: tool.slug },
        update: {
          title: tool.title,
          url: tool.url,
          icon: tool.icon || "Monitor",
          description: tool.description || "",
          categorySlug: cat.slug,
          order: tool.order,
        },
        create: {
          slug: tool.slug,
          title: tool.title,
          url: tool.url,
          icon: tool.icon || "Monitor",
          description: tool.description || "",
          categorySlug: cat.slug,
          order: tool.order,
        },
      });
    }
  }
  console.log(`✓ ${categoriesData.length} tool categories seeded`);

  // ── 3. Content Sections ────────────────────────────────────────────────────
  for (const sec of sectionsData) {
    const section = await prisma.contentSection.upsert({
      where: { slug: sec.slug },
      update: {
        title: sec.title,
        parentSlug: sec.parentSlug,
        description: (sec as Record<string, unknown>).description as string ?? "",
        author: (sec as Record<string, unknown>).author as string ?? null,
        authorUrl: (sec as Record<string, unknown>).authorUrl as string ?? null,
        colSpan: (sec as Record<string, unknown>).colSpan as number ?? 1,
        order: sec.order,
        buttonLabel: (sec as Record<string, unknown>).buttonLabel as string ?? null,
        buttonUrl: (sec as Record<string, unknown>).buttonUrl as string ?? null,
      },
      create: {
        slug: sec.slug,
        title: sec.title,
        parentSlug: sec.parentSlug,
        description: (sec as Record<string, unknown>).description as string ?? "",
        author: (sec as Record<string, unknown>).author as string ?? null,
        authorUrl: (sec as Record<string, unknown>).authorUrl as string ?? null,
        colSpan: (sec as Record<string, unknown>).colSpan as number ?? 1,
        order: sec.order,
        buttonLabel: (sec as Record<string, unknown>).buttonLabel as string ?? null,
        buttonUrl: (sec as Record<string, unknown>).buttonUrl as string ?? null,
      },
    });

    // Media items
    const media = (sec as Record<string, unknown>).media as Array<Record<string, unknown>> | undefined;
    if (media) {
      // Clear existing media for this section
      await prisma.sectionMedia.deleteMany({ where: { sectionId: section.id } });
      for (let i = 0; i < media.length; i++) {
        const m = media[i];
        await prisma.sectionMedia.create({
          data: {
            sectionId: section.id,
            type: toMediaType(m.type as string),
            url: (m.url as string) ?? null,
            gurl: (m.gurl as string) ?? null,
            yurl: (m.yurl as string) ?? null,
            alt: (m.alt as string) ?? null,
            caption: (m.caption as string) ?? null,
            order: i,
          },
        });
      }
    }

    // Links
    const links = (sec as Record<string, unknown>).links as Array<Record<string, string>> | undefined;
    if (links) {
      await prisma.sectionLink.deleteMany({ where: { sectionId: section.id } });
      for (let i = 0; i < links.length; i++) {
        await prisma.sectionLink.create({
          data: {
            sectionId: section.id,
            label: links[i].label,
            url: links[i].url,
            order: i,
          },
        });
      }
    }

    // Slides
    const slides = (sec as Record<string, unknown>).slides as Array<Record<string, unknown>> | undefined;
    if (slides) {
      for (const slide of slides) {
        const slideRec = await prisma.slideItem.upsert({
          where: { slug: slide.slug as string },
          update: {
            title: (slide.title as string) ?? "",
            sectionId: section.id,
            backgroundImage: (slide.backgroundImage as string) ?? null,
            layout: (slide.layout as string) ?? "single",
            order: (slide.order as number) ?? 0,
          },
          create: {
            slug: slide.slug as string,
            title: (slide.title as string) ?? "",
            sectionId: section.id,
            backgroundImage: (slide.backgroundImage as string) ?? null,
            layout: (slide.layout as string) ?? "single",
            order: (slide.order as number) ?? 0,
          },
        });

        // Columns
        const columns = slide.columns as Array<Record<string, unknown>> | undefined;
        if (columns) {
          await prisma.slideColumn.deleteMany({ where: { slideId: slideRec.id } });
          for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const colMedia = col.media as Record<string, unknown> | undefined;
            await prisma.slideColumn.create({
              data: {
                slideId: slideRec.id,
                type: (col.type as string) ?? "text",
                content: (col.content as string) ?? null,
                order: i,
                mediaType: colMedia ? (colMedia.type as string) : null,
                mediaUrl: colMedia ? (colMedia.url as string ?? null) : null,
                mediaGurl: colMedia ? (colMedia.gurl as string ?? null) : null,
                mediaYurl: colMedia ? (colMedia.yurl as string ?? null) : null,
              },
            });
          }
        }
      }
    }
  }
  console.log(`✓ ${sectionsData.length} content sections seeded`);

  // ── 4. Modules ─────────────────────────────────────────────────────────────
  for (const mod of modulesData) {
    await prisma.module.upsert({
      where: { slug: mod.slug },
      update: {
        title: mod.title,
        href: mod.href,
        display: mod.display,
        order: mod.order,
        children: (mod as Record<string, unknown>).children as string[] ?? [],
        subNav: (mod as Record<string, unknown>).subNav as object ?? null,
      },
      create: {
        slug: mod.slug,
        title: mod.title,
        href: mod.href,
        display: mod.display,
        order: mod.order,
        children: (mod as Record<string, unknown>).children as string[] ?? [],
        subNav: (mod as Record<string, unknown>).subNav as object ?? null,
      },
    });
  }
  console.log(`✓ ${modulesData.length} modules seeded`);

  // ── 5. Spine Members ───────────────────────────────────────────────────────
  await prisma.spineMember.deleteMany();
  for (const spine of DEFAULT_SPINE) {
    await prisma.spineMember.create({ data: spine });
  }
  console.log(`✓ ${DEFAULT_SPINE.length} spine members seeded`);

  // ── 6. Teams & Members ─────────────────────────────────────────────────────
  for (const t of DEFAULT_TEAMS) {
    const team = await prisma.team.upsert({
      where: { seqId: t.id },
      update: { label: t.label },
      create: { seqId: t.id, label: t.label },
    });

    // Clear existing members
    await prisma.teamMember.deleteMany({ where: { teamId: team.id } });

    let order = 0;
    // Head
    await prisma.teamMember.create({
      data: { teamId: team.id, name: t.head.name, img: t.head.img, role: "head", order: order++ },
    });
    // TLs
    for (const tl of t.tls) {
      await prisma.teamMember.create({
        data: { teamId: team.id, name: tl.name, img: tl.img, role: "tl", order: order++ },
      });
    }
    // ATLs
    for (const atl of t.atls) {
      await prisma.teamMember.create({
        data: { teamId: team.id, name: atl.name, img: atl.img, role: "atl", order: order++ },
      });
    }
    // Engineers
    for (const eng of t.engineers) {
      await prisma.teamMember.create({
        data: { teamId: team.id, name: eng.name, img: eng.img, role: "engineer", order: order++ },
      });
    }
  }
  console.log(`✓ ${DEFAULT_TEAMS.length} teams seeded`);

  // ── 7. Team Drive Categories ───────────────────────────────────────────────
  await prisma.teamDriveItem.deleteMany();
  await prisma.teamDriveCategory.deleteMany();
  for (let i = 0; i < DEFAULT_TEAM_DRIVE.length; i++) {
    const cat = DEFAULT_TEAM_DRIVE[i];
    const dbCat = await prisma.teamDriveCategory.create({
      data: { title: cat.title, order: i },
    });
    for (let j = 0; j < cat.items.length; j++) {
      const item = cat.items[j];
      await prisma.teamDriveItem.create({
        data: {
          categoryId: dbCat.id,
          label: item.label,
          url: item.url,
          urlType: item.urlType,
          order: j,
        },
      });
    }
  }
  console.log(`✓ ${DEFAULT_TEAM_DRIVE.length} team drive categories seeded`);

  // ── 8. Vortex Data ─────────────────────────────────────────────────────────
  // Config
  await prisma.vortexConfig.upsert({
    where: { id: "singleton" },
    update: {
      heroTitle: DEFAULT_VORTEX.heroTitle,
      heroSubtitle: DEFAULT_VORTEX.heroSubtitle,
      bgType: DEFAULT_VORTEX.background.type,
      bgValue: DEFAULT_VORTEX.background.value,
    },
    create: {
      id: "singleton",
      heroTitle: DEFAULT_VORTEX.heroTitle,
      heroSubtitle: DEFAULT_VORTEX.heroSubtitle,
      bgType: DEFAULT_VORTEX.background.type,
      bgValue: DEFAULT_VORTEX.background.value,
    },
  });

  // Vortex categories
  await prisma.vortexItem.deleteMany();
  await prisma.vortexCategory.deleteMany();
  for (let i = 0; i < DEFAULT_VORTEX.categories.length; i++) {
    const vc = DEFAULT_VORTEX.categories[i];
    const dbVc = await prisma.vortexCategory.create({
      data: { title: vc.title, order: i },
    });
    for (let j = 0; j < vc.items.length; j++) {
      await prisma.vortexItem.create({
        data: { categoryId: dbVc.id, content: vc.items[j], order: j },
      });
    }
  }

  // Vortex credits
  await prisma.vortexCredit.deleteMany();
  for (let i = 0; i < DEFAULT_VORTEX.credits.length; i++) {
    await prisma.vortexCredit.create({
      data: { name: DEFAULT_VORTEX.credits[i].name, role: DEFAULT_VORTEX.credits[i].role, order: i },
    });
  }
  console.log("✓ Vortex page data seeded");

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
