// src/seed/seed.js
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "../config/database.js";
import prisma from "../config/prisma.js";
import { Role, User } from "../startup/models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS = [
  { name: "Roles", model: Role, file: "roles.json", hashPassword: false },
  { name: "Users", model: User, file: "users.json", hashPassword: true },
];

export const seedDatabase = async () => {
  try {
    for (const { name, model, file, hashPassword } of MODELS) {
      const filePath = path.join(__dirname, "exports", file);

      try {
        const fileContent = await fs.readFile(filePath, "utf-8");
        let data = JSON.parse(fileContent);

        if (!Array.isArray(data) || !data.length) {
          console.warn(`⚠️  Skipping ${name} — no valid data`);
          continue;
        }

        if (hashPassword) {
          data = await Promise.all(
            data.map(async (item) => {
              if (item.password) {
                item.password = await bcrypt.hash(item.password, 10);
              }
              if (
                item.role &&
                typeof item.role === "string" &&
                item.role.toLowerCase() === "user"
              ) {
                const role = await Role.findByName("user");
                if (role) {
                  item.roleId = role.id;
                  delete item.role;
                }
              }
              return item;
            })
          );
        }

        // Delete all existing records
        if (name === "Roles") {
          await prisma.role.deleteMany({});
          // Create roles one by one
          for (const roleData of data) {
            await prisma.role.create({ data: roleData });
          }
        } else if (name === "Users") {
          await prisma.user.deleteMany({});
          // Create users one by one
          for (const userData of data) {
            await prisma.user.create({ data: userData });
          }
        }

        console.log(`🌱 Seeded ${name} (${data.length} records)`);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn(`⚠️  Skipping ${name} — file not found: ${file}`);
        } else {
          console.error(`❌ Error seeding ${name}:`, err);
          console.error(err);
        }
      }
    }

    console.log("\n✅ All seeding completed successfully");
  } catch (err) {
    console.error("❌ Error during seeding:", err);
  }
};

// -----------------------------------------------------------------------------
// Standalone execution (npm run seed)
// -----------------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    console.log("🚀 Starting database seeding...");

    await connectDB();
    await seedDatabase();

    await prisma.$disconnect();
    console.log("🔒 PostgreSQL connection closed");
    process.exit(0);
  })();
}
