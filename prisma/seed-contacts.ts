import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const contacts = [
  { name: "Betopia Cloud", email: "BetopiaCloud@betopialimited.com" },
  { name: "Md. Saiful Islam", email: "saiful.islam@betopialimited.com" },
  { name: "Shawon Ghosh", email: "shawon.ghosh@betopialimited.com" },
  { name: "Md. Jahidul Islam", email: "jahidul.islam@betopialimited.com" },
  { name: "Ahmed Noor Alam", email: "ahmed.alam@betopialimited.com" },
  { name: "Adib Ebna Jamal", email: "adib.jamal@betopialimited.com" },
  { name: "Anik Mahmud Tushar", email: "anik@betopialimited.com" },
  { name: "Md. Naimul Hasan Durjay", email: "durjay@betopialimited.com" },
  { name: "Md. Shahin Showkat Ovee", email: "ovee@betopialimited.com" },
  { name: "Md Shahidullah", email: "shahidullah@betopialimited.com" },
  { name: "Sirazum Monira", email: "smonira@betopialimited.com" },
  { name: "Sondip Roy", email: "sondip.roy@betopialimited.com" },
  { name: "Md Mosabbir Hossain", email: "mosabbir@betopialimited.com" },
  { name: "Md. Ariful Islam", email: "arif@betopialimited.com" },
  { name: "Fabliha Chowdhury", email: "fabliha@betopialimited.com" },
  { name: "Farjana Yesmin", email: "farjana.yesmin@betopialimited.com" },
  { name: "Md Raton Islam", email: "raton@betopialimited.com" },
  { name: "Mohammad Shahiriar Hasan Badhon", email: "shahriar@betopialimited.com" },
  { name: "Srabanti Dey", email: "srabanti.dey@betopialimited.com" },
  { name: "Rakibul Islam Shiku", email: "rakibul@betopialimited.com" },
  { name: "Jahid Hassan", email: "jahid.hassan@betopialimited.com" },
  { name: "Muhammad Monir Hossain", email: "muhammad@betopialimited.com" },
  { name: "Mushfiqur Rahman", email: "mushfiqur@betopialimited.com" },
  { name: "Sales", email: "sales@betopialimited.com" },
  { name: "Mayinuddin Munna", email: "mayinuddin@betopialimited.com" },
  { name: "Md. Ashraful Mamun", email: "ashraful@betopialimited.com" },
  { name: "Rakibul Hassan", email: "rakibul.hassan@betopialimited.com" },
  { name: "Demo", email: "demo@betopialimited.com" },
  { name: "Rafsun Ahmad", email: "rafsun.ahmad@betopialimited.com" },
  { name: "Muhit Al Faisal", email: "muhit.faisal@betopialimited.com" },
  { name: "Nur Mohammod Sarkar (Tohad)", email: "nur.sarkar@betopialimited.com" },
  { name: "Emdad Hossain", email: "emdad.hossain@betopialimited.com" },
  { name: "Partners", email: "partners@betopialimited.com" },
  { name: "Fatema Tuz Zohora", email: "fatema.zohora@betopialimited.com" },
  { name: "Mohammad Masum Jahangir", email: "masum@betopialimited.com" },
  { name: "Rajib Hossain", email: "rajib.hossain@betopialimited.com" },
  { name: "Cloud Admin", email: "cloud.admin@betopialimited.com" },
  { name: "Partner", email: "partner@betopialimited.com" },
  { name: "Betopia Partners", email: "betopia.partners@betopialimited.com" },
  { name: "Info", email: "info@betopialimited.com" },
  { name: "Feedback", email: "feedback@betopialimited.com" },
  { name: "Cloud Admin AWS", email: "cloudadmin.aws@betopialimited.com" },
  { name: "DMARC", email: "dmarc@betopialimited.com" },
  { name: "Srabanti Dey (OEM)", email: "srabantidey.oem@betopialimited.com" },
  { name: "Support", email: "support@betopialimited.com" },
  { name: "Admin Betopia", email: "admin@betopialimited.com" },
];

async function main() {
  for (const c of contacts) {
    await db.employeeDirectory.upsert({
      where:  { email: c.email.toLowerCase() },
      update: { name: c.name },
      create: { name: c.name, email: c.email.toLowerCase() },
    });
  }
  console.log(`Seeded ${contacts.length} contacts`);
}

main().then(() => db.$disconnect()).catch((e) => { console.error(e); db.$disconnect(); process.exit(1); });
