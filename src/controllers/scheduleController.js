import pool from "../config.js/db.js";
import { paystackService } from "../utils/paystack.js";

const createSchedule = async (req, res, next) => {
  const user_id = req.users.id;

  // 1. Map the exact snake_case fields coming from the request body
  const {
    amount,
    recipient_name,
    recipient_account,
    recipient_bank_code,
    scheduled_date,
    frequency,
    description,
  } = req.body;

  try {
    // Fail early if crucial parameters are absent before hitting DB or Paystack
    if (
      !amount ||
      !recipient_name ||
      !recipient_account ||
      !recipient_bank_code ||
      !scheduled_date
    ) {
      res.status(400);
      throw new Error("Missing required payout scheduling fields.");
    }

    // 2. Verify User wallet balance limits
    const userBalance = await pool.query(
      `SELECT balance FROM users WHERE id = $1`,
      [user_id]
    );

    if (parseFloat(amount) > parseFloat(userBalance.rows[0].balance)) {
      res.status(400);
      throw new Error("Insufficient funds"); // 💥 Caught by the local catch block below
    }

    // 3. Request Paystack recipient registration
    console.log(
      `Registering transfer recipient: ${recipient_name} on Paystack`
    );

    const recipientCode = await paystackService.createRecipient(
      recipient_name,
      recipient_account,
      recipient_bank_code
    );

    // 4. Added 'frequency' column processing into database insert query
    const query = `
      INSERT INTO payments (
        user_id, amount, recipient_name, recipient_account, 
        recipient_bank_code, paystack_recipient_code, scheduled_date, 
        frequency, description
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *;
    `;

    const values = [
      user_id,
      amount,
      recipient_name,
      recipient_account,
      recipient_bank_code,
      recipientCode,
      scheduled_date,
      frequency || "once", // Defaults to one-time if not provided
      description,
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      message: "Autopay schedule created successfully!",
      data: result.rows[0],
    });
  } catch (error) {
    // If status wasn't set explicitly to 400 above, default to a 500 error
    if (res.statusCode === 200) res.status(500);

    // 🔥 THE FIX: Pass the error directly to Express's next() middleware thread!
    // This immediately exits the controller and invokes your global errorHandler + Winston logger.
    return next(error);
  }
};

const getSchedule = async (req, res) => {
  const user_id = req.users.id;
  try {
    const result = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1`,
      [user_id]
    );
    res.json({ result: result.rows });
  } catch (error) {
    console.log(error.message);
    res.status(500);
    throw new Error("Server error!");
  }
};

const getScheduleById = async (req, res) => {
  const id = req.params.id;
  const user_id = req.users.id;

  const result = await pool.query(
    `SELECT * FROM payments WHERE user_id = $1 AND id = $2`,
    [user_id, id]
  );
  if (result.rows.length === 0) {
    res.status(404);
    throw new Error("No payment found");
  }

  res.json({ success: true, data: result.rows[0], message: "" });
};

const updateSchedule = async (req, res) => {
  const user_id = req.users.id;
  const id = req.params.id;
  const {
    amount,
    scheduled_date,
    receiver_name,
    receiver_account,
    description,
    status,
  } = req.body;
  try {
    const checkQuery = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 AND id = $2`,
      [user_id, id]
    );

    if (checkQuery.rows.length === 0) {
      res.status(404);
      throw new Error("Payment not found");
    }

    if (checkQuery.rows[0].status === "completed") {
      res.status(400);
      throw new Error("Cannot update completed payments");
    }

    const updateQuery = `UPDATE payments SET amount = $1, scheduled_date = $2, status = $3, receiver_name = $4, receiver_account = $5, description = $6  WHERE id = $7 RETURNING *`;
    const values = [
      amount || checkQuery.rows[0].amount,
      scheduled_date || checkQuery.rows[0].scheduled_date,
      status || checkQuery.rows[0].status,
      receiver_name || checkQuery.rows[0].receiver_name,
      receiver_account || checkQuery.rows[0].receiver_account,
      description || checkQuery.rows[0].description,
      id,
    ];

    const result = await pool.query(updateQuery, values);
    res.json({
      success: true,
      data: result.rows[0],
      message: "Payment updated sccessfuly",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Error updating payment!" });
  }
};

const deleteSchedule = async (req, res) => {
  const user_id = req.users.id;
  const id = req.params.id;
  try {
    const checkQuery = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 AND id = $2`,
      [user_id, id]
    );
    if (checkQuery.rows.length === 0) {
      res.status(404);
      throw new Error("Payment not found");
    }

    await pool.query(`DELETE FROM payments WHERE user_id = $1 AND id = $2`, [
      user_id,
      id,
    ]);
    res.json({
      success: true,
      message: "Payment schedule deleted successfuly!",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ msg: "Faild to delete payment schedule" });
  }
};

export {
  createSchedule,
  getSchedule,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
};
