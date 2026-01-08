import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { mockPayment } from "@/services/api";
import type { PaymentIntent, Booking as ApiBooking, Garage, Slot } from "@/types";
import { useAppContext } from "@/context/AppContext";
import { useBookingContext, type Booking } from "@/context/BookingContext";

const methods = [
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
  { value: "cash", label: "Cash" },
];

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useAppContext();
  const { addBooking } = useBookingContext();
  const locationState = location.state as { 
    booking?: ApiBooking; 
    price?: number; 
    totalPrice?: number; 
    garage?: Garage; 
    slot?: Slot; 
    duration?: number;
  } | undefined;
  
  const apiBooking = locationState?.booking ?? state.activeBooking;
  const [method, setMethod] = useState(methods[0].value);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get price from state - prioritize price, then totalPrice, then booking.totalPrice
  const totalPrice = locationState?.price ?? locationState?.totalPrice ?? apiBooking?.totalPrice ?? 0;

  // Redirect if no booking data (direct access)
  useEffect(() => {
    if (!apiBooking && !locationState) {
      navigate("/home", { replace: true });
    }
  }, [apiBooking, locationState, navigate]);

  if (!apiBooking && !locationState) {
    return null; // Will redirect
  }

  if (!apiBooking) {
    return <p className="text-danger">No booking to pay for. Redirecting...</p>;
  }

  const handlePayment = async () => {
    if (!apiBooking || !locationState?.garage || !locationState?.slot) {
      setStatus("Missing booking data. Please try again.");
      return;
    }
    
    setLoading(true);
    setStatus("");
    
    try {
      // Generate new booking object using data from location.state
      const newBooking: Booking = {
        id: apiBooking.id,
        garageId: apiBooking.garageId,
        garageName: locationState.garage.name,
        slotId: apiBooking.slotId,
        userId: apiBooking.userId,
        vehiclePlate: apiBooking.vehiclePlate,
        price: locationState.slot.pricePerHour,
        totalPrice: totalPrice > 0 ? totalPrice : apiBooking.totalPrice,
        date: new Date().toISOString(),
        status: "active",
        time: apiBooking.time,
      };
      
      // Log booking for debugging before saving
      console.log("New booking created", newBooking);
      
      // Save booking to context/localStorage
      addBooking(newBooking);
      
      // Update AppContext for active booking tracking
      dispatch({ type: "SET_BOOKING", payload: apiBooking });
      
      // Process payment
      await mockPayment({
        bookingId: apiBooking.id,
        amount: newBooking.totalPrice,
        method: method as PaymentIntent["method"],
        status: "pending",
      });
      
      setStatus("Payment successful! Redirecting...");
      
      // Navigate to bookings page AFTER addBooking has been called
      navigate("/bookings");
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-semibold text-brand uppercase tracking-wider">Step 3</p>
        <h1 className="text-3xl font-bold font-heading">Payment</h1>
      </header>
      <div className="grid gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-5 rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-brand/10">
          <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Booking summary</h2>
          <dl className="space-y-3 text-base">
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <dt className="font-medium dark:text-text-dark-on-surface/70">Garage</dt>
              <dd className="font-bold dark:text-text-dark-on-surface">{locationState?.garage?.name ?? apiBooking.garageId}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <dt className="font-medium dark:text-text-dark-on-surface/70">Slot</dt>
              <dd className="font-bold dark:text-text-dark-on-surface">{apiBooking.slotId}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-slate-700">
              <dt className="font-medium dark:text-text-dark-on-surface/70">Vehicle</dt>
              <dd className="font-semibold dark:text-text-dark-on-surface">{apiBooking.vehiclePlate}</dd>
            </div>
          </dl>
          <div className="rounded-2xl bg-gradient-to-br from-brand/10 to-accent/10 p-6 dark:bg-gradient-to-br dark:from-brand/20 dark:to-accent/20 shadow-lg">
            <p className="text-sm font-semibold text-text-muted dark:text-text-dark-on-surface/70 uppercase tracking-wide">Total Amount</p>
            <p className="text-4xl font-bold font-heading text-brand dark:text-brand mt-2">${(totalPrice > 0 ? totalPrice : apiBooking.totalPrice).toFixed(2)}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0.9 }} animate={{ opacity: 1 }} className="space-y-5 rounded-3xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-300 dark:bg-surface-elevated-dark dark:border dark:border-slate-700/50 dark:hover:shadow-2xl dark:hover:shadow-brand/10">
          <h3 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Payment method</h3>
          <div className="grid gap-4">
            {methods.map((item) => (
              <button
                key={item.value}
                onClick={() => setMethod(item.value)}
                className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                  method === item.value 
                    ? "border-brand bg-brand-muted/40 shadow-lg dark:bg-brand-muted/20" 
                    : "border-slate-200 bg-white hover:border-brand/50 dark:border-slate-700 dark:bg-surface-elevated-dark"
                }`}
              >
                <span className="font-semibold dark:text-text-dark-on-surface">{item.label}</span>
                {method === item.value && <span className="text-brand font-bold">✓ Selected</span>}
              </button>
            ))}
          </div>
          <Button className="w-full text-lg py-4" onClick={handlePayment} disabled={loading}>
            {loading ? "Processing..." : "Pay Now"}
          </Button>
          {status && <p className="text-sm font-semibold text-brand text-center">{status}</p>}
        </motion.div>
      </div>
    </section>
  );
}
