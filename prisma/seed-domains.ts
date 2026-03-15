import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const domains = [
  "betopiagroup.com",
  "betopialimited.com",
  "betopiacloud.com",
];

async function main() {
  for (const domain of domains) {
    await db.allowedDomain.upsert({
      where:  { domain },
      update: { active: true },
      create: { domain, active: true },
    });
  }
  console.log(`Seeded ${domains.length} allowed domains`);
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); db.$disconnect(); process.exit(1); });
