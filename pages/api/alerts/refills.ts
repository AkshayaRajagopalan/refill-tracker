import { NextApiRequest, NextApiResponse } from 'next'
import { readAll } from '../../../data/storage'
import { calcRemainingDays } from '../../../lib/calc'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const meds = readAll()
  const soon = meds.filter(m => {
    const daysLeft = calcRemainingDays(m)
    return daysLeft <= 7
  })
  res.status(200).json(soon)
}
