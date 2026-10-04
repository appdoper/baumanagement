/**
 * Bootstraps the first admin user. Idempotent: if the admin already exists,
 * nothing changes (and no password is printed — it is only shown at creation).
 *
 * Run with: npm run db:seed:admin
 */
import { userService } from "@/container";
import { prisma } from "@/infrastructure/prisma/client";

const email = process.env.ADMIN_EMAIL ?? "admin@haus.local";
const name = process.env.ADMIN_NAME ?? "Administrator";

async function main() {
  const { user, password } = await userService.ensureAdmin(email, name);

  if (!password) {
    console.log(`\nℹ️  Admin „${user.email}" existiert bereits — kein neues Passwort erzeugt.\n`);
    return;
  }

  const line = "═".repeat(52);
  console.log(`\n${line}`);
  console.log("  ADMIN-ZUGANG ERSTELLT — Passwort jetzt kopieren!");
  console.log(line);
  console.log(`  E-Mail:    ${user.email}`);
  console.log(`  Passwort:  ${password}`);
  console.log(`${line}`);
  console.log("  Dieses Passwort wird NICHT erneut angezeigt.\n");
}

main()
  .catch((e) => {
    console.error("❌ Admin-Seed fehlgeschlagen:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
