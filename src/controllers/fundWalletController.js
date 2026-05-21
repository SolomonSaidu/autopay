import pool from "../config.js/db.js";
import { initPayment } from "../utils/paystack.js";
import { resolveAccountNumber } from "../utils/paystack.js";

const initializePayment = async (req, res) => {
  const { email, amount } = req.body;

  try {
    const result = await initPayment(email, amount);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log(error.message);

    res.status(400).json({
      success: false,
      msg: "Faild to initialize payment...",
    });
  }
};

const verifyAccountNumber = async (req, res) => {
  const { accountNumber, bankCode } = req.body;

  try {
    const accountData = await resolveAccountNumber(accountNumber, bankCode);
    res.json({ success: true, data: accountData });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ success: false, msg: "Faild to get account details..." });
  }
};

export { initializePayment, verifyAccountNumber };
