import nodeCron from "node-cron";
import pool from "../config.js/db.js";
import { paystackService } from "../utils/paystack.js";

const startPaymentScheduler = () => {
  // nodeCron.schedule("*/1 * * * *", async () => {
  //   console.log("--- 🚀 Starting 6:00 AM Payout Job ---");
  //   const client = await pool.connect();
  //   try {
  //     // 1. Find all PENDING payments due today or earlier
  //     const fetchQuery = `
  //           SELECT p.*, u.balance as user_wallet_balance
  //           FROM payments p
  //           JOIN users u ON p.user_id = u.id
  //           WHERE p.status = 'pending' AND p.scheduled_date <= NOW()
  //       `;
  //     const { rows: duePayments } = await client.query(fetchQuery);
  //     if (duePayments.length === 0) {
  //       console.log("No payments due today.");
  //       return;
  //     }
  //     for (const payment of duePayments) {
  //       try {
  //         // START TRANSACTION FOR THIS SPECIFIC PAYOUT
  //         await client.query("BEGIN");
  //         // 2. Check if user has enough money in their internal wallet
  //         if (
  //           parseFloat(payment.user_wallet_balance) < parseFloat(payment.amount)
  //         ) {
  //           throw new Error("Insufficient wallet balance");
  //         }
  //         // 3. Trigger Paystack Transfer
  //         const transfer = await paystackService.initiateTransfer(
  //           payment.amount,
  //           payment.paystack_recipient_code,
  //           `PAY-${payment.id}-${Date.now()}` // Unique external reference
  //         );
  //         // 4. Update internal wallet (Debit)
  //         await client.query(
  //           "UPDATE users SET balance = balance - $1 WHERE id = $2",
  //           [payment.amount, payment.user_id]
  //         );
  //         // 5. Mark payment as completed
  //         await client.query(
  //           "UPDATE payments SET status = 'completed' WHERE id = $1",
  //           [payment.id]
  //         );
  //         // 6. Record in Transactions Table (Audit Trail)
  //         await client.query(
  //           `INSERT INTO transactions (user_id, amount, type, category, payment_id, gateway_reference, status)
  //                    VALUES ($1, $2, 'debit', 'autopay_payout', $3, $4, 'success')`,
  //           [payment.user_id, payment.amount, payment.id, transfer.reference]
  //         );
  //         await client.query("COMMIT");
  //         console.log(`✅ Paid ${payment.recipient_name}: ₦${payment.amount}`);
  //       } catch (error) {
  //         await client.query("ROLLBACK");
  //         console.error(`❌ Failed payment ${payment.id}:`, error.message);
  //         console.error(
  //           `❌ Failed payment ${payment.id}:`,
  //           error.response?.data?.message || error.message
  //         );
  //         // Optional: Update payment status to 'failed' in DB
  //         await client.query(
  //           "UPDATE payments SET status = 'failed' WHERE id = $1",
  //           [payment.id]
  //         );
  //       }
  //     }
  //   } catch (err) {
  //     console.error("CRITICAL SCHEDULER ERROR:", err.message);
  //   } finally {
  //     client.release();
  //   }
  // });
};

export default startPaymentScheduler;
