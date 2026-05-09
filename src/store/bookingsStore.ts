'use client';
import { create } from 'zustand';
import type { Booking, BookingStatus } from '@/types';
import { mockBookings } from '@/data/mock';

interface BookingsStore {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  cancelBooking: (id: string) => void;
  updateStatus: (id: string, status: BookingStatus) => void;
  getUserBookings: (userId: string) => Booking[];
  getMasterBookings: (masterId: string) => Booking[];
  getBookingById: (id: string) => Booking | undefined;
  getUpcomingBookings: (userId: string) => Booking[];
  getPastBookings: (userId: string) => Booking[];
}

const today = (): string => new Date().toISOString().split('T')[0];

// Цей стор — "база даних" записів у клієнтській частині
// bookingWizardStore — окремо, тільки для UI стану форми бронювання
export const useBookingsStore = create<BookingsStore>((set, get) => ({
  bookings: mockBookings,

  addBooking: (bookingData) => {
    const booking: Booking = {
      ...bookingData,
      id: `book-${crypto.randomUUID()}`,
      createdAt: today(),
    };
    set({ bookings: [...get().bookings, booking] });
    return booking;
  },

  cancelBooking: (id) => {
    set({
      bookings: get().bookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' } : b
      ),
    });
  },

  updateStatus: (id, status) => {
    set({
      bookings: get().bookings.map((b) =>
        b.id === id ? { ...b, status } : b
      ),
    });
  },

  // Селектори — фільтрують без зміни стану
  getBookingById: (id) => get().bookings.find((b) => b.id === id),

  getUserBookings: (userId) =>
    get().bookings.filter((b) => b.clientId === userId),

  getMasterBookings: (masterId) =>
    get().bookings.filter((b) => b.masterId === masterId),

  // Майбутні активні записи користувача
  getUpcomingBookings: (userId) =>
    get()
      .bookings.filter(
        (b) =>
          b.clientId === userId &&
          b.date >= today() &&
          b.status !== 'cancelled'
      )
      .sort((a, b) => a.date.localeCompare(b.date)),

  // Минулі або завершені записи користувача
  getPastBookings: (userId) =>
    get()
      .bookings.filter(
        (b) =>
          b.clientId === userId &&
          (b.date < today() || b.status === 'completed' || b.status === 'cancelled')
      )
      .sort((a, b) => b.date.localeCompare(a.date)), // від нового до старого
}));