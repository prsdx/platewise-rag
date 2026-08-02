import api from "./api";

/**
 * Triggers the Razorpay payment modal popup.
 * Works seamlessly in test mode and live mode.
 */
export async function openRazorpayCheckout({
  plan = "pro",
  amount = 3999,
  userEmail = "chef@restaurant.com",
  userName = "Executive Chef",
  onSuccess = () => {},
  onError = () => {},
}) {
  try {
    // 1. Request Order details from backend
    const orderRes = await api.post("/billing/create-razorpay-order", {
      plan,
      amount,
    });

    const { order_id, currency, key_id } = orderRes.data;

    // 2. Configure Razorpay modal options
    const options = {
      key: key_id || "rzp_test_platewise123",
      amount: amount * 100, // Amount in paise
      currency: currency || "INR",
      name: "PlateWise AI Pro",
      description: `Upgrade to PlateWise ${plan.toUpperCase()} Plan`,
      image: "https://cdn-icons-png.flaticon.com/512/3448/3448609.png", // Culinary badge
      order_id: order_id,
      handler: async function (response) {
        try {
          // 3. Verify payment signature on backend
          await api.post("/billing/verify-razorpay-payment", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature || "test_signature",
            plan,
          });

          onSuccess(response);
        } catch (err) {
          console.error("Payment verification error:", err);
          onError("Payment verification failed.");
        }
      },
      prefill: {
        name: userName,
        email: userEmail,
        contact: "9999999999",
      },
      theme: {
        color: "#10B981", // Emerald accent color
      },
    };

    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      // Test mode fallback simulation
      alert(`[Razorpay Test Simulation]\nOrder Created: ${order_id}\nAmount: ₹${amount}\n\nClick OK to simulate successful payment verification!`);
      await api.post("/billing/verify-razorpay-payment", {
        razorpay_payment_id: "pay_test_" + Math.random().toString(36).substring(2, 10),
        razorpay_order_id: order_id,
        plan,
      });
      onSuccess({ razorpay_payment_id: "pay_test_simulated" });
    }
  } catch (err) {
    console.error("Razorpay Checkout Error:", err);
    onError(err.message || "Failed to initiate payment.");
  }
}
