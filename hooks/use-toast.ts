"use client"

import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
}

interface ToastState {
  toasts: Toast[]
}

const initialState: ToastState = {
  toasts: [],
}

let globalState = initialState
let listeners: Array<(state: ToastState) => void> = []

const dispatch = (state: ToastState) => {
  globalState = state
  listeners.forEach((listener) => listener(state))
}

export const useToast = () => {
  const [state, setState] = useState(globalState)

  const subscribe = useCallback((listener: (state: ToastState) => void) => {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  useState(() => {
    const unsubscribe = subscribe(setState)
    return unsubscribe
  })

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: Toast = {
        id,
        title,
        description,
        variant,
        duration,
      }

      dispatch({
        toasts: [...globalState.toasts, newToast],
      })

      // Auto remove toast after duration
      setTimeout(() => {
        dismiss(id)
      }, duration)

      // Simple console logging for now
      console.log(`Toast [${variant}]: ${title}${description ? ` - ${description}` : ''}`)
    },
    []
  )

  const dismiss = useCallback((toastId: string) => {
    dispatch({
      toasts: globalState.toasts.filter((t) => t.id !== toastId),
    })
  }, [])

  return {
    toast,
    dismiss,
    toasts: state.toasts,
  }
}