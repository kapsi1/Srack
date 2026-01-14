import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
import { Pool } from "pg";
import { PrismaClient } from "../generated/client/client";

dotenv.config();

const connectionString = process.env.DATABASE_URL?.replace(
	"localhost",
	"127.0.0.1",
);
const pool = new Pool({ connectionString });

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
