import { create } from 'zustand';
import { Customer, QueueState } from '@sadoo/types';

interface QueueStore {
  queue: QueueState;
  setQueue: (queue: QueueState) => void;
  addCustomer: (customer: Customer) => void;
  removeCustomer: (customerId: string) => void;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => void;
  clearQueue: () => void;
}

export const useQueueStore = create<QueueStore>((set) => ({
  queue: { customers: [], totalWaiting: 0, averageWaitTime: 0 },
  setQueue: (queue) => set({ queue }),
  addCustomer: (customer) =>
    set((state) => ({
      queue: {
        ...state.queue,
        customers: [...state.queue.customers, customer],
        totalWaiting: state.queue.totalWaiting + 1,
      },
    })),
  removeCustomer: (customerId) =>
    set((state) => ({
      queue: {
        ...state.queue,
        customers: state.queue.customers.filter((c) => c.id !== customerId),
        totalWaiting: state.queue.totalWaiting - 1,
      },
    })),
  updateCustomer: (customerId, updates) =>
    set((state) => ({
      queue: {
        ...state.queue,
        customers: state.queue.customers.map((c) =>
          c.id === customerId ? { ...c, ...updates } : c,
        ),
      },
    })),
  clearQueue: () => set({ queue: { customers: [], totalWaiting: 0, averageWaitTime: 0 } }),
}));
