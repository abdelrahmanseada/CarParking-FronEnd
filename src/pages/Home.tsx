import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { fetchGarages } from "@/services/api";
import type { Garage, Slot } from "@/types";
import { MapView } from "@/components/map/MapView";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ParkingLayout } from "@/components/ParkingLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const filtersSchema = z.object({
  search: z.string().optional(),
  duration: z.string().default("2"),
});

type FiltersForm = z.infer<typeof filtersSchema>;

export function HomePage() {
  const [garages, setGarages] = useState<Garage[]>([]);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ctaMessage, setCtaMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<FiltersForm>({
    resolver: zodResolver(filtersSchema),
    defaultValues: { duration: "2" },
  });

  const durationValue = watch("duration");

  const durationLabel = useMemo(() => {
    const duration = Number(durationValue);
    if (Number.isNaN(duration)) return "2 hours";
    return `${duration} hour${duration > 1 ? "s" : ""}`;
  }, [durationValue]);

  const totalPrice = useMemo(() => {
    if (!selectedSlot) return 0;
    const duration = Number(durationValue ?? 1);
    return selectedSlot.pricePerHour * (Number.isNaN(duration) ? 1 : duration);
  }, [selectedSlot, durationValue]);

  const loadGarages = useCallback(async (params?: FiltersForm) => {
    setLoading(true);
    setError(null);
    // Mock data always succeeds - no error handling needed
    const list = await fetchGarages({ q: params?.search });
    setGarages(list);
    setSelectedGarage((prev) => list.find((garage) => garage.id === prev?.id) ?? list[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadGarages();
  }, [loadGarages]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedGarage?.id]);

  const onSubmit = handleSubmit((values) => {
    void loadGarages(values);
  });

  const handleBookNow = () => {
    if (!selectedGarage) {
      setCtaMessage("Choose a garage to continue.");
      return;
    }
    if (!selectedSlot) {
      setCtaMessage("Tap an available slot to continue.");
      return;
    }
    setCtaMessage(null);
    navigate("/booking/confirm", {
      state: {
        garageId: selectedGarage.id,
        slotId: selectedSlot.id,
        duration: Number(durationValue ?? 1),
      },
    });
  };

  return (
    <section className="space-y-10 pb-20">
      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-muted/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-brand">
          <img src="/favicon.png" alt="ParkSpot" className="h-4 w-4" />
          <span>ParkSpot</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h1 className="text-3xl font-bold font-heading text-text dark:text-text-dark-on-surface lg:text-4xl">
            Find Your Perfect Spot in Seconds
          </h1>
          <p className="text-base text-text-muted dark:text-text-dark-on-surface/70">
            Secure, convenient parking at your fingertips. Book instantly, park stress-free.
          </p>
        </div>
      </motion.header>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card grid gap-4 md:grid-cols-4"
      >
        <Input label="Search a location" placeholder="Downtown" {...register("search")} />
        <Select
          label="Duration"
          {...register("duration")}
          options={[
            { value: "1", label: "1 hour" },
            { value: "2", label: "2 hours" },
            { value: "3", label: "3 hours" },
            { value: "6", label: "6 hours" },
          ]}
        />
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Find Parking Now
          </Button>
        </div>
      </motion.form>

      {loading && <LoadingSpinner label="Loading garages" />}
      {error && <p className="text-danger dark:text-danger">{error}</p>}

      {!loading && selectedGarage && (
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div className="space-y-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <MapView garages={garages} onSelect={setSelectedGarage} selectedGarageId={selectedGarage?.id} />
            <div className="glass-card space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">{selectedGarage.name}</h2>
                  <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70 mt-1">{selectedGarage.location.address}</p>
                </div>
                <span className="rounded-full bg-brand-muted px-5 py-2.5 font-bold text-lg text-brand">
                  ${selectedGarage.pricePerHour}/h
                </span>
              </div>
              <p className="text-text-muted dark:text-text-dark-on-surface/80">{selectedGarage.description}</p>
              <div className="flex flex-wrap gap-2 text-sm text-text-muted dark:text-text-dark-on-surface/70">
                {selectedGarage.amenities?.map((amenity) => (
                  <span key={amenity} className="rounded-full bg-surface px-3 py-1 dark:bg-surface-dark dark:text-text-dark-on-surface/80">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div className="glass-card space-y-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <header className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">Selected duration</p>
                <h3 className="text-xl font-bold dark:text-text-dark-on-surface">{durationLabel}</h3>
              </div>
              <Button variant="secondary" disabled={!selectedSlot} onClick={handleBookNow}>
                {selectedSlot ? "Reserve My Spot" : "Select a slot"}
              </Button>
            </header>
            <ParkingLayout
              slots={selectedGarage.floors?.[0]?.layout ?? []}
              selectedSlotId={selectedSlot?.id}
              onSelect={(slot) => setSelectedSlot(slot)}
            />
            {selectedSlot && (
              <div className="rounded-2xl bg-brand-muted/40 p-6 text-text dark:bg-brand-muted/20 dark:text-text-dark-on-surface dark:border dark:border-brand/30 shadow-lg">
                <p className="text-sm font-medium text-text-muted dark:text-text-dark-on-surface/70">Selected Slot</p>
                <p className="text-3xl font-bold font-heading dark:text-text-dark-on-surface mt-1">#{selectedSlot.number}</p>
                <p className="text-lg font-semibold text-brand dark:text-brand mt-2">${totalPrice.toFixed(2)} total</p>
              </div>
            )}
            {ctaMessage && <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger dark:bg-danger/20 dark:text-danger">{ctaMessage}</p>}
          </motion.div>
        </div>
      )}

      {!loading && garages.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 mt-12">
          <h3 className="text-2xl font-bold font-heading dark:text-text-dark-on-surface">Recommended garages</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {garages.map((garage) => (
              <article
                key={garage.id}
                className={`glass-card flex gap-5 border border-transparent transition-all hover:border-brand hover:scale-[1.02] cursor-pointer dark:border-slate-700/50 ${
                  selectedGarage?.id === garage.id ? "border-brand shadow-2xl" : ""
                }`}
              >
                <div className="relative h-32 w-44 overflow-hidden rounded-2xl bg-gradient-to-br from-brand/30 to-accent/30 shadow-md">
                  <img
                    src={garage.image}
                    alt={garage.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.visibility = "hidden";
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between py-1">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold dark:text-text-dark-on-surface">{garage.name}</h4>
                      <span className="text-brand font-bold text-lg">${garage.pricePerHour}/h</span>
                    </div>
                    <p className="text-sm text-text-muted dark:text-text-dark-on-surface/70">{garage.location.address}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted dark:text-text-dark-on-surface/70">
                    <span>{garage.availableSlots} spots available</span>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedGarage(garage)}>
                      Select
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </motion.div>
      )}
    </section>
  );
}


