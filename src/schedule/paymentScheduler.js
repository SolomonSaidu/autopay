import nodeCron from "node-cron";
import pool from "../config.js/db.js";

const startPaymentScheduler = () => {
  nodeCron.schedule("* * * * *", async () => {
    const client = await pool.connect();
    console.log("working...");

    try {
      await client.query(`BEGIN`);

      const duePayments =
        await client.query(`SELECT * FROM payments WHERE status = 'pending' AND
            scheduled_date <= (NOW() AT TIME ZONE 'UTC') FOR UPDATE SKIP LOCKED`);

      console.log(duePayments.rows);

      if (duePayments.rows.length > 0) {
        console.log(`Processing ${duePayments.rows.length} payments...`);
      }
      await client.query(`COMMIT`);
    } catch (error) {
      await client.query(`ROLLBACK`);
      console.log(error.message);
    } finally {
      client.release();
    }
  });
};

export default startPaymentScheduler;
