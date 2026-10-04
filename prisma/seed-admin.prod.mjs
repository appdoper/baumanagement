// Standalone admin bootstrap for the production container (no TS, no `@/`
// aliases, no src/). Mirrors src/lib/password.ts hashing exactly so the
// created credentials verify against the running app.
//
// Run inside the container:  node prisma/seed-admin.prod.mjs
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

function generatePassword(groups = 3, groupSize = 4) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const length = groups * groupSize;
  const bytes = randomBytes(length);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  const parts = [];
  for (let i = 0; i < length; i += groupSize) {
    parts.push(chars.slice(i, i + groupSize).join(""));
  }
  return parts.join("-");
}

const prisma = new PrismaClient();
const email = (process.env.ADMIN_EMAIL ?? "admin@haus.local").toLowerCase();
const name = process.env.ADMIN_NAME ?? "Administrator";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`\nℹ️  Admin „${email}" existiert bereits — kein neues Passwort erzeugt.\n`);
    return;
  }

  const password = generatePassword();
  await prisma.user.create({
    data: {
      email,
      name,
      role: "ADMIN",
      passwordHash: hashPassword(password),
      requiresPasswordChange: true,
    },
  });

  const line = "═".repeat(52);
  console.log(`\n${line}`);
  console.log("  ADMIN-ZUGANG ERSTELLT — Passwort jetzt kopieren!");
  console.log(line);
  console.log(`  E-Mail:    ${email}`);
  console.log(`  Passwort:  ${password}`);
  console.log(line);
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
