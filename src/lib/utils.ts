import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateMockEcgData(length = 100) {
  const data = []
  let lastY = 50
  for (let i = 0; i < length; i++) {
    const y =
      lastY +
      Math.sin(i * 0.5) * 15 + // Main wave
      (Math.random() - 0.5) * 5 + // Noise
      (i % 20 === 0 ? (Math.random() > 0.5 ? 20 : -10) : 0) // Spikes for QRS
    lastY = y
    data.push({ time: i, value: Math.round(y) })
  }
  return data
}
