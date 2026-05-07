import pool from "../config.js/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  const { name, email, password } = req.body;

  let user = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  if (user.rows.length > 0) {
    res.status(400);
    throw new Error("Email already in use");
  }

  const password_hash = await bcrypt.hash(password, 10);
  let result = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email`,
    [name, email, password_hash]
  );

  res.json({
    success: true,
    data: result.rows[0],
    message: "User registered successfuly!",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  const user = result.rows[0];

  if (result.rows.length === 0) {
    res.status(400);
    throw new Error("User dose not exist");
  }
  const resultPass = user.password_hash;

  const comparePass = await bcrypt.compare(password, resultPass);
  if (!comparePass) {
    res.status(404);
    throw new Error("Incorrect details");
  }

  const token = jwt.sign(
    { id: result.rows[0].id, email: result.rows[0].email },
    process.env.SECRET_KEY,
    { expiresIn: "1h" }
  );

  res.json({
    success: true,
    token,
    data: { id: user.id, name: user.name, email: user.email },
    message: "Login successful!",
  });
};

const profile = async (req, res) => {
  const { id } = req.users;

  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);

  if (result.rows[0].length === 0) {
    res.status(400);
    throw new Error("User dose not exist!");
  }

  res.json({ success: true, data: result.rows[0], message: "Successful!" });
};

export { register, login, profile };
