import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.FUEL_FINDER_CLIENT_ID || !process.env.FUEL_FINDER_CLIENT_SECRET) {
  throw new Error(
    "Missing credentials: set FUEL_FINDER_CLIENT_ID and FUEL_FINDER_CLIENT_SECRET in .env",
  );
}
