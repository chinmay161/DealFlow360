import { prisma } from "@/lib/prisma";

async function main() {
  const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  console.log("Current tables in public schema:");
  for (const t of tables) {
    console.log(` - ${t.table_name}`);
  }
}

main().finally(() => prisma.$disconnect());
