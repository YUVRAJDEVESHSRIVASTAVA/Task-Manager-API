import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";
import { recordAuditLog } from "../src/lib/audit";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@taskmanager.local").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin123!";
  const name = process.env.ADMIN_NAME ?? "Admin User";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN", name },
      });
    }

    console.log(`Admin account already exists: ${email}`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });

  await recordAuditLog({
    action: "ADMIN_SEEDED",
    message: `Seeded admin account for ${admin.email}`,
    userId: admin.id,
  });

  console.log(`Created admin account: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
