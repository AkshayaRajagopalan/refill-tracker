import { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { readAll, save } from '../../../data/storage'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const meds = readAll()
    return res.status(200).json(meds)
  }

  if (req.method === 'POST') {
    const body = req.body
    const id = uuidv4()

    // Start with any provided doses.
    const doses: any[] = Array.isArray(body.doses) ? [...body.doses] : []

    // If startDate is provided and is before today (date-only), backfill
    // taken doses for each past day up to yesterday, using frequencyPerDay
    // and avoiding duplicates.
    try {
      if (body.startDate) {
        // parse date-only (YYYY-MM-DD) into a local Date at midnight to avoid
        // timezone parsing quirks from `new Date('YYYY-MM-DD')` which can be UTC.
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

        const start = parseDateOnly(body.startDate)
        if (!start) throw new Error('invalid startDate')
        const today = new Date()
        // normalize both to local midnight
        start.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)
        const msPerDay = 24 * 60 * 60 * 1000
        const fullDays = Math.floor((today.getTime() - start.getTime()) / msPerDay)
        // fullDays represents how many past calendar days exist between start and today
        // (e.g., start=19, today=21 -> fullDays=2 -> backfill 19 and 20)
        if (fullDays > 0) {
          const perDay = Number(body.frequencyPerDay) || 1
          const counts: Record<string, number> = {}
          for (const d of doses) {
            if (!d || !d.date) continue
            counts[String(d.date)] = (counts[String(d.date)] || 0) + 1
          }
          for (let i = 0; i < fullDays; i++) {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            const key = formatDateLocal(d)
            const have = counts[key] || 0
            for (let j = have; j < perDay; j++) doses.push({ date: key, taken: true })
          }
        }
      }
    } catch (e) {
      console.warn('med creation backfill skipped due to invalid startDate', e)
    }

    const med = { ...body, id, doses }
    save(med)
    return res.status(201).json(med)
  }

  res.setHeader('Allow', 'GET,POST')
  res.status(405).end('Method Not Allowed')
}
