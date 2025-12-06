import { create } from 'zustand';
import { getRandomTip } from '../data/practiceTips';

interface TipsState {
  currentTip: string;
  lastUpdatedDate: string | null;
  loadDailyTip: () => void;
  getNewTip: () => void;
}

const getTodayDate = (): string => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

export const useTipsStore = create<TipsState>((set, get) => ({
  currentTip: '',
  lastUpdatedDate: null,

  loadDailyTip: () => {
    const { lastUpdatedDate } = get();
    const todayDate = getTodayDate();

    // Check if we need a new tip for today
    if (lastUpdatedDate !== todayDate) {
      const newTip = getRandomTip();
      set({ currentTip: newTip, lastUpdatedDate: todayDate });
    } else if (!get().currentTip) {
      // If no tip is loaded yet, get one
      const newTip = getRandomTip();
      set({ currentTip: newTip, lastUpdatedDate: todayDate });
    }
  },

  getNewTip: () => {
    const newTip = getRandomTip();
    const todayDate = getTodayDate();
    set({ currentTip: newTip, lastUpdatedDate: todayDate });
  },
}));

