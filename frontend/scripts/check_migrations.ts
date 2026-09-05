import { prisma } from "@/lib/prisma";

async function main() {
  const migrations: Array<{ migration_name: string; finished_at: Date }> = await prisma.$queryRaw`
    SELECT migration_name, finished_at 
    FROM _prisma_migrations 
    ORDER BY finished_at ASC;
  `;
  console.log("Applied migrations in database:");
  for (const m of migrations) {
    console.log(` - ${m.migration_name} (finished at: ${m.finished_at})`);
  }
}

main().finally(() => prisma.$disconnect());
