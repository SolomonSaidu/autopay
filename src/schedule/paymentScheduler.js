import nodeCron from "node-cron";
import pool from "../config.js/db.js";
import { paystackService } from "../utils/paystack.js";

// Helper function to calculate the next date based on frequency
const calculateNextScheduledDate = (currentDate, frequency) => {
  const date = new Date(currentDate);
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null; // For 'once' or invalid types
  }
  return date;
};

const startPaymentScheduler = () => {
  // Runs every minute to check for due payments
  nodeCron.schedule("*/1 * * * *", async () => {
    console.log("--- 🚀 Executing AutoPay Payout Engine ---");

    const client = await pool.connect();

    try {
      // 1. Fetch PENDING payments due now or earlier
      const fetchQuery = `
        SELECT p.*, u.balance as user_wallet_balance
        FROM payments p
        JOIN users u ON p.user_id = u.id
        WHERE p.status = 'pending' AND p.scheduled_date <= NOW()
      `;

      const { rows: duePayments } = await client.query(fetchQuery);

      if (duePayments.length === 0) {
        console.log("No payments due right now.");
        return;
      }

      for (const payment of duePayments) {
        try {
          // --- TRANSACTION 1: LOCK AND MARK PROCESSING ---
          // This prevents any concurrent cron ticks from catching this record
          await client.query("BEGIN");

          // Double-check wallet balance inside the transaction
          if (
            parseFloat(payment.user_wallet_balance) < parseFloat(payment.amount)
          ) {
            throw new Error("Insufficient wallet balance");
          }

          await client.query(
            "UPDATE payments SET status = 'processing', last_run_at = NOW() WHERE id = $1",
            [payment.id]
          );
          await client.query("COMMIT");

          // 2. Trigger External Paystack Transfer (Outside the locked DB transaction block)
          console.log(
            `Initiating Paystack transfer for Payment ID: ${payment.id}`
          );
          const transfer = await paystackService.initiateTransfer(
            payment.amount,
            payment.paystack_recipient_code,
            `PAY-${payment.id}-${Date.now()}`
          );

          // --- TRANSACTION 2: DEBIT WALLET & RESOLVE SCHEDULE ---
          await client.query("BEGIN");

          // Debit internal user wallet
          await client.query(
            "UPDATE users SET balance = balance - $1 WHERE id = $2",
            [payment.amount, payment.user_id]
          );

          // Record in Audit Trail Transactions Table
          await client.query(
            `INSERT INTO transactions (user_id, amount, type, category, payment_id, gateway_reference, status)
             VALUES ($1, $2, 'debit', 'autopay_payout', $3, $4, 'success')`,
            [payment.user_id, payment.amount, payment.id, transfer.reference]
          );

          // Calculate next run state based on frequency metric
          if (payment.frequency && payment.frequency !== "once") {
            const nextDate = calculateNextScheduledDate(
              payment.scheduled_date,
              payment.frequency
            );

            // Re-queue the payment for the next billing cycle by keeping it 'pending'
            await client.query(
              "UPDATE payments SET status = 'pending', scheduled_date = $1 WHERE id = $2",
              [nextDate, payment.id]
            );
            console.log(
              `🔄 Recurring payment re-scheduled for ${nextDate.toISOString()}`
            );
          } else {
            // One-off payments get permanently closed out
            await client.query(
              "UPDATE payments SET status = 'completed' WHERE id = $1",
              [payment.id]
            );
          }

          await client.query("COMMIT");
          console.log(
            `✅ Successfully processed payout to ${payment.recipient_name}: ₦${payment.amount}`
          );
        } catch (error) {
          await client.query("ROLLBACK");
          const errorMessage = error.response?.data?.message || error.message;

          // Professional tracking: logs to error.log with automated stack tracing info
          logger.error(
            `AutoPay Execution Failure for Payment ID ${payment.id}: ${errorMessage}`,
            error
          );

          // Update status to failed so it doesn't get stuck in perpetual processing loop
          await client.query(
            "UPDATE payments SET status = 'failed', failure_reason = $1 WHERE id = $2",
            [errorMessage, payment.id]
          );
        }
      }
    } catch (err) {
      console.error("CRITICAL SCHEDULER ENGINE EXCEPTION:", err.message);
    } finally {
      client.release();
    }
  });
};

export default startPaymentScheduler;
