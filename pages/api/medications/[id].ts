import { NextApiRequest, NextApiResponse } from 'next'
import { getById, update, remove } from '../../../data/storage'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string }
  if (req.method === 'GET') {
    const med = getById(id)
    if (!med) return res.status(404).end('Not found')
    return res.status(200).json(med)
  }

  if (req.method === 'PUT') {
    try {
      const existing = getById(id)
      if (!existing) return res.status(404).end('Not found')
      const incoming: Partial<typeof existing> = { ...req.body }

      // Merge doses: if incoming.doses is provided, use it; otherwise keep existing.doses
      const mergedDoses = Array.isArray(incoming.doses)
        ? [...incoming.doses]
        : existing.doses

      // Prepare a safe merged med object (ignore incoming id)
      const merged = {
        ...existing,
        ...incoming,
        id: existing.id,
        doses: mergedDoses,
      }

      // If startDate is present in incoming (either new or changed), run backfill
      if (incoming.startDate) {
        try {
          const parseDateOnly = (s: string) => {
            const parts = String(s).split('-').map((p) => Number(p))
            if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
            const [y, m, d] = parts
            return new Date(y, m - 1, d)
          }
          const formatDateLocal = (dt: Date) => {
            const y = dt.getFullYear()
            const m = String(dt.getMonth() + 1).padStart(2, '0')
            const d = String(dt.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
          }

          const start = parseDateOnly(String(merged.startDate))
          if (start) {
            start.setHours(0, 0, 0, 0)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const msPerDay = 24 * 60 * 60 * 1000
            const fullDays = Math.floor((today.getTime() - start.getTime()) / msPerDay)
            if (fullDays > 0) {
              const perDay = Number(merged.frequencyPerDay) || 1
              const counts: Record<string, number> = {}
              const out: any[] = Array.isArray(merged.doses) ? [...merged.doses] : []
              for (const d of out) {
                if (!d || !d.date) continue
                counts[String(d.date)] = (counts[String(d.date)] || 0) + 1
              }
              for (let i = 0; i < fullDays; i++) {
                const d = new Date(start)
                d.setDate(start.getDate() + i)
                const key = formatDateLocal(d)
                const have = counts[key] || 0
                for (let j = have; j < perDay; j++) out.push({ date: key, taken: true })
              }
              merged.doses = out
            }
          }
        } catch (e) {
          // non-fatal: skip backfill
          console.warn('backfill skipped on update', e)
        }
      }

      const patched = update(id, merged)
      return res.status(200).json(patched)
    } catch (e: any) {
      console.error('PUT /api/medications/[id] error', e)
      return res.status(500).end('Internal error')
    }
  }

  if (req.method === 'DELETE') {
    remove(id)
    return res.status(204).end()
  }

  res.setHeader('Allow', 'GET,PUT,DELETE')
  res.status(405).end('Method Not Allowed')
}
