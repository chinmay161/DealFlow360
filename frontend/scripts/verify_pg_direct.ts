import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const contact = await prisma.contact.findFirst({
    where: { email: "mrextradummy@gmail.com" },
    include: {
      customer: {
        include: {
          quotations: {
            select: {
              id: true,
              quotationNumber: true,
              totalValue: true,
              status: true,
              currency: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  console.log("--- DIRECT POSTGRESQL RECORD ---");
  console.log(JSON.stringify(contact, null, 2));

  const intents = await prisma.portalLoginIntent.findMany({
    where: { email: "mrextradummy@gmail.com" },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("--- RECENT LOGIN INTENTS FOR EMAIL ---");
  console.log(JSON.stringify(intents, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
