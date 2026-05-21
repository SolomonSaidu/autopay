import pool from "../config.js/db.js";

const getHistory = async (req, res) => {
  const { id } = req.users;

  try {
    const transactionHistory = await pool.query(
      `SELECT 
    t.id, 
    t.amount, 
    t.type, 
    t.category, 
    t.gateway_reference, -- Fixed here
    t.status, 
    t.created_at 
  FROM transactions t 
  WHERE t.user_id = $1
  ORDER BY t.created_at DESC`,
      [id]
    );

    if (transactionHistory.rows.length === 0) {
      res.status(404);
      throw new Error("No transaction history found");
    }

    res.json({
      status: "success",
      data: transactionHistory.rows,
    });
  } catch (error) {
    res.status(500);
    throw new Error(error.message);
  }
};

const getHistoryById = async (req, res) => {
  const { id } = req.users;
  const transactionId = req.params.id;

  try {
    const transactionHistoryById = await pool.query(
      `SELECT t.id AS transaction_id,
         t.amount, t.type, t.category, t.created_at, p.status AS payment_status FROM
         transactions t LEFT JOIN payments p ON t.reference_id = p.id WHERE t.user_id = $1 AND t.id = $2
         ORDER BY t.created_at DESC`,
      [id, transactionId]
    );

    if (transactionHistoryById.rows.length === 0) {
      res.status(404);
      throw new Error("Cannot find transaction");
    }

    res.json({
      status: "success",
      data: transactionHistoryById.rows[0],
    });
  } catch (error) {
    res.status(500);
    throw new Error("Server error");
  }
};

export { getHistory, getHistoryById };
