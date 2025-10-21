import fs from 'fs'
import path from 'path'

const DATA_FILE = path.resolve(process.cwd(), 'data', 'medications.json')

export type DoseRecord = {
  date: string // ISO date
  taken: boolean
}

export type Medication = {
  id: string
  name: string
  dosage: string
  frequencyPerDay: number
  startDate: string // ISO
  quantity: number
  doses?: DoseRecord[]
  daysSupply: number
}

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]')
}

export function readAll(): Medication[] {
  try {
    ensureDataDir()
    const raw = fs.readFileSync(DATA_FILE, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('readAll error', e)
    return []
  }
}

export function writeAll(meds: Medication[]) {
  ensureDataDir()
  fs.writeFileSync(DATA_FILE, JSON.stringify(meds, null, 2))
}

export function getById(id: string) {
  return readAll().find(m => m.id === id)
}

export function save(med: Medication) {
  const meds = readAll()
  meds.push(med)
  writeAll(meds)
}

export function update(id: string, patch: Partial<Medication>) {
  const meds = readAll()
  const i = meds.findIndex(m => m.id === id)
  if (i === -1) return null
  // Never allow the id to be changed by a patch
  const { id: _maybeId, ...rest } = patch as any
  meds[i] = { ...meds[i], ...rest }
  writeAll(meds)
  return meds[i]
}

export function remove(id: string) {
  const meds = readAll()
  const filtered = meds.filter(m => m.id !== id)
  writeAll(filtered)
}
