import pool from "../config.js/db.js";

const createSchedule = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query(`BEGIN`);

    const user_id = req.users.id;
    const {
      amount,
      scheduled_date,
      status,
      receiver_name,
      receiver_account,
      description,
    } = req.body;

    // GET USERS BALANCE
    const userBalance = await client.query(
      `SELECT balance FROM users WHERE id = $1`,
      [user_id] //
    );

    if (amount > userBalance.rows[0].balance) {
      res.status(400);
      throw new Error("Insufficient funds");
    }

    //UPDATE USERS BALANCE
    await client.query(
      `UPDATE users SET balance = balance - $2 WHERE id = $1 RETURNING balance`,
      [user_id, amount] //
    );

    const result = await client.query(
      `INSERT INTO payments (amount, scheduled_date, status, receiver_name, receiver_account, description, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, amount, scheduled_date, status, receiver_name, receiver_account, description, user_id, created_at`,
      [
        amount,
        scheduled_date,
        status,
        receiver_name,
        receiver_account,
        description,
        user_id,
      ]
    );

    const paymentSchedule = result.rows[0];

    //INSERT INTO TRANSACTION TABLE
    await client.query(
      `INSERT INTO transactions (user_id, amount, type, category, reference_id) VALUES ($1, $2, $3, $4, $5)`,
      [user_id, amount, "debit", "payment_deduction", paymentSchedule.id]
    );

    await client.query(`COMMIT`);

    res.status(201).json({
      success: true,
      data: {
        amount: paymentSchedule.amount,
        scheduled_date: paymentSchedule.scheduled_date,
        status: paymentSchedule.status,
        receiver_name: paymentSchedule.receiver_name,
        receiver_account: paymentSchedule.receiver_account,
        description: paymentSchedule.description,
      },
      message: "Payment Schedule created!",
    });
  } catch (error) {
    await client.query(`ROLLBACK`);

    res.status(500);
    throw new Error(error.message);
  } finally {
    client.release();
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
