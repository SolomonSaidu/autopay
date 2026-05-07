import pool from "../config.js/db.js";

const fundWallet = async (req, res) => {
  const { amount, type, category } = req.body;
  const { id } = req.users;

  const addTransaction = await pool.query(
    `INSERT INTO transactions (user_id, amount, type, category) VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, amount, type, category]
  );

  if (addTransaction.rows[0].length === 0) {
    res.status(500);
    throw new Error("Transaction cannot be added, server error");
  }

  const updateBalance = await pool.query(
    `UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING balance`,
    [amount, id]
  );

  const transaction = addTransaction.rows[0];
  res.status(201).json({
    success: true,
    data: {
      status: "success",
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      balance: updateBalance.rows[0],
    },
  });
};

export { fundWallet };
