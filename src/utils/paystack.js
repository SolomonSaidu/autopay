import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const paystack = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export const resolveAccountNumber = async (accountNumber, bankCode) => {
  try {
    const response = await paystack.get(
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    return response.data.data; // This returns { account_number, account_name }
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to resolve account"
    );
  }
};

export const initPayment = async (email, amount) => {
  try {
    const response = await paystack.post("/transaction/initialize", {
      email,
      amount: amount * 100, // Paystack counts in Kobo (1000 = ₦10)
      callback_url: "http://localhost:3000/api/payment-success", // Where to go after paying
    });
    return response.data.data; // Returns { authorization_url, reference, access_code }
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Payment initialization failed"
    );
  }
};

export const paystackService = {
  // Step 1: Create a Recipient (The Handshake)
  createRecipient: async (name, accountNumber, bankCode) => {
    try {
      const response = await paystack.post("/transferrecipient", {
        type: "nuban",
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      });
      return response.data.data.recipient_code;
    } catch (error) {
      // --- INSERT THIS TEMPORARY DEBUGGING BLOCK ---
      if (error.response) {
        console.error("🔴 PAYSTACK VALIDATION REJECTION:");
        console.error("Status Code:", error.response.status);
        console.error(
          "Response Data:",
          JSON.stringify(error.response.data, null, 2)
        );
      } else {
        console.error("🔴 NETWORK ERROR:", error.message);
      }
      // ----------------------------------------------
      throw error;
    }
  },

  // Step 2: Initiate the Transfer (The Payout)
  initiateTransfer: async (amount, recipientCode, reference) => {
    // Check if we are in development/test mode
    if (process.env.NODE_ENV === "localhost") {
      console.log(`🏗️ MOCK TRANSFER: Sending ₦${amount} to ${recipientCode}`);
      return {
        status: true,
        reference: reference,
        data: { status: "success" },
      };
    }

    const response = await paystack.post("/transfer", {
      source: "balance",
      amount: amount * 100, // Kobo
      recipient: recipientCode,
      reference: reference, // Your internal Payment ID
    });
    return response.data.data;
  },
};
