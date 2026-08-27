export type ToastKind = 'success' | 'error' | 'info'

export interface ToastMessage {
  id: number
  kind: ToastKind
  message: string
}

type Listener = (toasts: ToastMessage[]) => void

let toasts: ToastMessage[] = []
let nextId = 1
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l([...toasts]))
}

export function toast(message: string, kind: ToastKind = 'info') {
  const id = nextId++
  toasts = [...toasts, { id, kind, message }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3000)
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts(): ToastMessage[] {
  return [...toasts]
}
