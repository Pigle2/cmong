'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserType } from '@/types'

interface AuthStore {
  mode: UserType
  setMode: (mode: UserType) => void
  toggleMode: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      mode: 'BUYER',
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === 'BUYER' ? 'SELLER' : 'BUYER',
        })),
    }),
    {
      name: 'auth-mode',
    }
  )
)
