import "dotenv/config";
import { defineConfig } from "drizzle-kit";

function must(v: string | undefined, name: string) {
  if (!v) throw new Error(`${name} is required`);
  return v;
}

const url = new URL(must(process.env.DATABASE_URL, "DATABASE_URL"));

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    host: url.hostname,
    port: Number(url.port || "3306"),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
    ssl: {
      rejectUnauthorized: true,
    },
  },
});
