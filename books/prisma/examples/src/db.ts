import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.ts";
export function openDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL을 설정하세요.");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
}
