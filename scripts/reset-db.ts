import * as dotenv from "dotenv";
dotenv.config();
import { db } from "../lib/db";
import { sql } from "drizzle-orm";

async function reset() {
    console.log("Dropping tables...");
    await db.execute(sql`DROP TABLE IF EXISTS downloads CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS reviews CASCADE`);
    // 'apps' might fail if I already updated schema code, but the DB still has it.
    // Try dropping both old and new names to be safe.
    await db.execute(sql`DROP TABLE IF EXISTS apps CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS versions CASCADE`);
    await db.execute(sql`DROP TABLE IF EXISTS applications CASCADE`);
    console.log("Tables dropped.");
    process.exit(0);
}

reset().catch(console.error);
