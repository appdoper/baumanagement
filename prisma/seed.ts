/**
 * Seed / smoke test for the foundation. Exercises the CRUD services end-to-end
 * through the composition root against the real database.
 *
 * Run with: npm run db:seed
 */
import { projectService } from "@/container";
import { taskService } from "@/container";
import { prisma } from "@/infrastructure/prisma/client";

async function main() {
  console.log("→ Creating root project...");
  const haus = await projectService.create({
    name: "Haus-Sanierung 2026",
    description: "Oberprojekt für alle Sanierungsarbeiten.",
  });

  console.log("→ Creating sub-project (WBS)...");
  const dach = await projectService.create({
    name: "Dachboden ausbauen",
    parentId: haus.id,
  });

  console.log("→ Creating tasks...");
  const daemmen = await taskService.create({
    title: "Dachboden dämmen",
    description: "Zwischensparrendämmung einbringen.",
    projectId: dach.id,
    status: "TODO",
    estimatedCostCents: 180000,
    deadline: new Date("2026-06-30"),
  });

  const boden = await taskService.create({
    title: "Boden verlegen",
    description: "Kann erst nach der Dämmung starten (FS).",
    projectId: dach.id,
    estimatedCostCents: 95000,
  });

  console.log("→ Verifying reads...");
  const children = await projectService.listChildren(haus.id);
  const tasks = await taskService.list({ projectId: dach.id });

  console.log("\n✅ Smoke test OK");
  console.log(`   Root project: ${haus.name} (${haus.id})`);
  console.log(`   Sub-projects: ${children.map((c) => c.name).join(", ")}`);
  console.log(`   Tasks in "${dach.name}": ${tasks.map((t) => t.title).join(", ")}`);
  console.log(`   Prepared dependency candidates: ${daemmen.title} -> ${boden.title}`);
}

main()
  .catch((e) => {
    console.error("❌ Smoke test failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
