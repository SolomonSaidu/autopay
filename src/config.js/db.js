import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
// import { database, password } from "pg/lib/defaults";
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT || 5000,
});

pool.connect((err) => {
  if (err) console.log("Postgres connection error", err);
  else console.log("Connected to Postgres database");
});

export default pool;
