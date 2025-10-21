import { Medication } from '../data/storage'

export function calcTakenCount(med: Medication) {
  return (med.doses || []).filter(d => d.taken).length
}

export function calcMissedCount(med: Medication) {
  return (med.doses || []).filter(d => !d.taken).length
}

export function calcDosesUsedSinceStart(med: Medication) {
  const start = new Date(med.startDate)
  const now = new Date()
  const days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, days) * med.frequencyPerDay
}

/**
 * Use recorded taken doses when available (more accurate), otherwise
 * fall back to expected doses used since start date.
 */
export function calcUsedDoses(med: Medication) {
  // Use recorded taken doses only. Backfilled creations will produce dose
  // records for past days, so this avoids double-counting when a med was
  // created with an assumed start date.
  return (med.doses || []).filter(d => d.taken).length
}

export function calcRemainingDoses(med: Medication) {
  const used = calcUsedDoses(med)
  return Math.max(0, med.quantity - used)
}

export function calcRemainingDays(med: Medication) {
  const remaining = calcRemainingDoses(med)
  const perDay = med.frequencyPerDay || 1
  return Math.ceil(remaining / perDay)
}

export function calcNextRefillDate(med: Medication) {
  const daysLeft = calcRemainingDays(med)
  const d = new Date()
  d.setDate(d.getDate() + daysLeft)
  return d.toISOString().slice(0, 10)
}

export function calcAdherencePercent(med: Medication) {
  const taken = calcTakenCount(med)
  const missed = calcMissedCount(med)
  const total = taken + missed
  if (total === 0) return 100
  return Math.round((taken / total) * 100)
}

export function calcRecordedTodayCount(med: Medication) {
  const today = new Date().toISOString().slice(0, 10)
  return (med.doses || []).filter(d => d.date === today).length
}

