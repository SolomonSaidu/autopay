import pool from "../config.js/db.js";

const getHistory = async (req, res) => {
  const { id } = req.users;

  // 1. Extract and parse pagination parameters from the URL query string
  // Example: /api/transactions/history?page=2&limit=10
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  // Calculate how many records the database should skip
  const offset = (page - 1) * limit;

  try {
    // 2. Query A: Get the total count of transactions for this specific user
    // This is crucial for the frontend to calculate total pages
    const countQuery = `SELECT COUNT(*) FROM transactions WHERE user_id = $1`;
    const countResult = await pool.query(countQuery, [id]);
    const totalItems = parseInt(countResult.rows[0].count, 10);

    if (totalItems === 0) {
      return res.status(200).json({
        status: "success",
        message: "No transaction history found",
        data: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: page,
          limit,
        },
      });
    }

    // 3. Query B: Fetch the paginated subset of transactions using LIMIT and OFFSET
    const fetchQuery = `
      SELECT 
        t.id, 
        t.amount, 
        t.type, 
        t.category, 
        t.gateway_reference, 
        t.status, 
        t.created_at 
      FROM transactions t 
      WHERE t.user_id = $1
      ORDER BY t.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const transactionHistory = await pool.query(fetchQuery, [
      id,
      limit,
      offset,
    ]);

    // Calculate total pages dynamically
    const totalPages = Math.ceil(totalItems / limit);

    // 4. Return data along with a metadata pagination block
    return res.json({
      status: "success",
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: transactionHistory.rows,
    });
  } catch (error) {
    if (res.statusCode === 200) res.status(500);
    return res.json({
      success: false,
      message: error.message,
    });
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
