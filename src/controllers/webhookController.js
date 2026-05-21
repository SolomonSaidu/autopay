import crypto from "crypto";
import pool from "../config.js/db.js";

const paystackWebhook = async (req, res) => {
  console.log("📌 WEHOOK ACTIVATED: Paystack just pinged the server!");

  // 1. Verify Signature
  const payload = req.rawBody || JSON.stringify(req.body || {});
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];
  console.log(`📡 Signature Received: ${signature ? "YES" : "NO"}`);

  if (hash !== signature) {
    console.error(
      "❌ FAILURE: Webhook signature validation failed. Dropping request."
    );
    return res.status(401).send("Invalid signature");
  }

  console.log("✅ SUCCESS: Signature verified perfectly!");
  const event = req.body;
  console.log(`📦 Event Type detected: ${event?.event}`);

  // 2. Handle the "charge.success" event
  if (event.event === "charge.success") {
    const { amount, customer, reference } = event.data;
    const realAmount = amount / 100;
    const userEmail = customer.email;

    console.log(
      `💳 Processing payment of ₦${realAmount} for user email: ${userEmail}`
    );

    const client = await pool.connect();
    try {
      console.log("🔄 Starting DB Transaction (BEGIN)...");
      await client.query("BEGIN");

      // 3. Update User Balance
      console.log(`⚡ Querying: UPDATE users SET balance... for ${userEmail}`);
      const updateResult = await client.query(
        "UPDATE users SET balance = balance + $1 WHERE email = $2 RETURNING *",
        [realAmount, userEmail]
      );

      console.log(`📊 Rows updated count: ${updateResult.rows.length}`);

      if (updateResult.rows.length === 0) {
        console.warn(
          `⚠️ WARNING: The email "${userEmail}" does NOT exist in your users table. Aborting!`
        );
        await client.query("ROLLBACK");
        client.release();
        return res.status(200).send("No matching user found");
      }

      const userId = updateResult.rows[0].id;
      console.log(
        `👤 User found! ID: ${userId}. Proceeding to write history...`
      );

      // 4. Record Transaction
      await client.query(
        "INSERT INTO transactions (user_id, amount, type, category, gateway_reference) VALUES ($1, $2, $3, $4, $5)",
        [userId, realAmount, "credit", "wallet_funding", reference]
      );
      console.log("📝 Transaction history row inserted successfully.");

      await client.query("COMMIT");
      console.log(
        `🎉 SUCCESS: Wallet credited ₦${realAmount} for ${userEmail}`
      );
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("❌ CRITICAL DB ERROR INSIDE WEBHOOK:", err);
    } finally {
      client.release();
    }
  } else {
    console.log(
      `ℹ️ Event skipped because it wasn't charge.success (Got: ${event.event})`
    );
  }

  res.sendStatus(200);
};

export { paystackWebhook };
