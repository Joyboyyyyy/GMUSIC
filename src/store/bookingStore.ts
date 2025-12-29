import { create } from 'zustand';

interface BookingState {
  buildingId: string | null;
  date: string | null;
  slot: string | null;
  setBuildingId: (buildingId: string | null) => void;
  setDate: (date: string | null) => void;
  setSlot: (slot: string | null) => void;
  resetBooking: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  buildingId: null,
  date: null,
  slot: null,

  setBuildingId: (buildingId: string | null) => {
    set({ buildingId });
  },

  setDate: (date: string | null) => {
    set({ date });
  },

  setSlot: (slot: string | null) => {
    set({ slot });
  },

  resetBooking: () => {
    set({
      buildingId: null,
      date: null,
      slot: null,
    });
  },
}));

