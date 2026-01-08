// ==================== FRONTEND-ONLY MODE: ALL API CALLS BYPASSED ====================
// This file is configured for frontend-only prototype mode.
// All functions return mock data immediately - NO backend calls are made.

import type { Booking, Floor, Garage, PaymentIntent, Slot, User } from "@/types";
import { bookings, garages, user as mockUser } from "./mockData";

// Simulate network delay for realistic UX
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// ==================== AUTHENTICATION ====================

/**
 * Login - Returns mock user immediately, no server call
 */
export async function login(payload: { email: string; password: string }): Promise<{ user: User; token: string }> {
  await delay();
  
  const result = {
    user: {
      ...mockUser,
      email: payload.email, // Use provided email
    },
    token: "mock-token-" + Date.now(),
  };
  
  // Store in localStorage for session persistence
  localStorage.setItem("auth_token", result.token);
  localStorage.setItem("user", JSON.stringify(result.user));
  
  console.log("✅ Mock login successful:", result.user.email);
  return result;
}

/**
 * Register - Returns mock user immediately, no server call
 */
export async function register(payload: { name: string; email: string; password: string }): Promise<User> {
  await delay();
  
  const newUser: User = {
    id: `user-${Date.now()}`,
    name: payload.name,
    email: payload.email,
  };
  
  // Store in localStorage
  localStorage.setItem("user", JSON.stringify(newUser));
  localStorage.setItem("auth_token", "mock-token-" + Date.now());
  
  return newUser;
}

/**
 * Logout - Clears localStorage only
 */
export async function logout(): Promise<void> {
  await delay();
  localStorage.removeItem("auth_token");
  sessionStorage.removeItem("auth_token");
  localStorage.removeItem("user");
}

/**
 * Refresh token - Returns mock token
 */
export async function refresh(): Promise<{ token: string }> {
  await delay();
  const token = "mock-token-refreshed-" + Date.now();
  localStorage.setItem("auth_token", token);
  return { token };
}

// ==================== PROFILE ====================

/**
 * Get user profile - Returns mock user
 */
export async function fetchProfile(userId: string): Promise<User> {
  await delay();
  return mockUser;
}

/**
 * Update user profile - Returns updated mock user
 */
export async function updateProfile(
  userId: string,
  updates: { name?: string; email?: string; phone?: string }
): Promise<User> {
  await delay();
  const updated = {
    ...mockUser,
    ...updates,
  };
  localStorage.setItem("user", JSON.stringify(updated));
  return updated;
}

// ==================== GARAGES/PLACES ====================

/**
 * Get all garages - Returns mock garages
 */
export async function fetchGarages(params?: {
  lat?: number;
  lng?: number;
  q?: string;
  filters?: string;
  name?: string;
}): Promise<Garage[]> {
  await delay();
  
  if (!params?.q && !params?.name) {
    return garages;
  }
  
  const searchTerm = (params.q || params.name || "").toLowerCase().trim();
  return garages.filter(
    (garage) =>
      garage.name.toLowerCase().includes(searchTerm) ||
      garage.location.address.toLowerCase().includes(searchTerm) ||
      garage.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Search places - Returns filtered mock garages
 */
export async function searchPlaces(name: string): Promise<Garage[]> {
  await delay();
  const searchTerm = name.toLowerCase().trim();
  if (!searchTerm) {
    return garages;
  }
  return garages.filter(
    (garage) =>
      garage.name.toLowerCase().includes(searchTerm) ||
      garage.location.address.toLowerCase().includes(searchTerm) ||
      garage.description.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get single garage - Returns mock garage
 */
export async function fetchGarage(id: string): Promise<Garage> {
  await delay();
  const match = garages.find((garage) => garage.id === id);
  if (!match) {
    throw new Error("Garage not found");
  }
  return match;
}

// ==================== PARKING SLOTS ====================

/**
 * Get parking slots for a garage - Returns mock slots
 */
export async function fetchParkingSlots(placeId: string): Promise<Slot[]> {
  await delay();
  const garage = garages.find((g) => g.id === placeId);
  if (!garage?.floors?.[0]?.layout) {
    return [];
  }
  return garage.floors[0].layout;
}

/**
 * Get single parking slot - Returns mock slot
 */
export async function fetchParkingSlot(placeId: string, slotId: string): Promise<Slot> {
  await delay();
  const garage = garages.find((g) => g.id === placeId);
  const slot = garage?.floors?.flatMap((f) => f.layout || []).find((s) => s.id === slotId);
  if (!slot) {
    throw new Error("Slot not found");
  }
  return slot;
}

/**
 * Reserve a parking slot - Creates mock booking
 */
export async function reserveSlot(
  placeId: string,
  slotId: string,
  payload?: { vehiclePlate?: string; durationHours?: number }
): Promise<Booking> {
  await delay();
  
  const booking: Booking = {
    id: `booking-${Date.now()}`,
    status: "confirmed",
    totalPrice: 0,
    userId: mockUser.id,
    garageId: placeId,
    slotId: slotId,
    vehiclePlate: payload?.vehiclePlate || "TEMP-123",
    time: {
      start: new Date().toISOString(),
      end: new Date(Date.now() + (payload?.durationHours || 1) * 60 * 60 * 1000).toISOString(),
      durationHours: payload?.durationHours || 1,
    },
  };
  
  bookings.push(booking);
  return booking;
}

/**
 * Release (cancel) a parking slot - Updates mock booking
 */
export async function releaseSlot(placeId: string, slotId: string): Promise<void> {
  await delay();
  const booking = bookings.find((b) => b.slotId === slotId && b.garageId === placeId);
  if (booking) {
    booking.status = "cancelled";
  }
}

// ==================== LEGACY COMPATIBILITY ====================

/**
 * Get floors for a garage - Returns mock floors
 */
export async function fetchFloors(garageId: string): Promise<Floor[]> {
  await delay();
  const garage = garages.find((g) => g.id === garageId);
  if (!garage?.floors) {
    return [];
  }
  return garage.floors;
}

/**
 * Get slots for a floor - Returns mock slots
 */
export async function fetchSlots(floorId: string): Promise<Slot[]> {
  await delay();
  const floor = garages.flatMap((g) => g.floors ?? []).find((f) => f.id === floorId);
  if (!floor?.layout) {
    return [];
  }
  return floor.layout;
}

// ==================== BOOKINGS ====================

/**
 * Create booking - Creates mock booking
 */
export async function createBooking(payload: Partial<Booking>): Promise<Booking> {
  if (!payload.garageId || !payload.slotId) {
    throw new Error("Garage ID and Slot ID are required");
  }
  
  return reserveSlot(payload.garageId, payload.slotId, {
    vehiclePlate: payload.vehiclePlate,
    durationHours: payload.time?.durationHours,
  });
}

/**
 * Cancel booking - Updates mock booking
 */
export async function cancelBooking(id: string): Promise<Booking> {
  await delay();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) throw new Error("Booking not found");
  booking.status = "cancelled";
  return booking;
}

/**
 * Get active booking - Returns mock booking
 */
export async function fetchActiveBooking(id: string): Promise<Booking> {
  await delay();
  const booking = bookings.find((b) => b.id === id) ?? bookings[0];
  return booking;
}

/**
 * Get user bookings - Returns mock bookings for user
 */
export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  await delay();
  return bookings.filter((b) => b.userId === userId || userId === mockUser.id);
}

// ==================== PAYMENT ====================

/**
 * Process payment - Returns mock payment result
 */
export async function processPayment(payload: PaymentIntent): Promise<PaymentIntent> {
  await delay();
  return { ...payload, status: "paid" };
}

/**
 * @deprecated Use processPayment instead
 */
export const mockPayment = processPayment;
