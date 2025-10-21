import React, { useState } from "react";

type Props = { onSaved?: () => void; onCancel?: () => void; initial?: any };

type FormState = {
  name: string;
  dosage: string;
  frequencyPerDay: number;
  startDate: string;
  quantity: number;
  daysSupply: number;
};

export default function MedicationForm({ onSaved, onCancel, initial }: Props) {
  const [form, setForm] = useState<FormState>(() => ({
    name: initial?.name || "",
    dosage: initial?.dosage || "",
    frequencyPerDay: initial?.frequencyPerDay || 1,
    startDate: initial?.startDate || new Date().toISOString().slice(0, 10),
    quantity: initial?.quantity || 30,
    daysSupply: initial?.daysSupply || 30,
  }));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name || form.name.trim().length === 0)
      errs.name = "Name is required";
    if (!form.dosage || form.dosage.trim().length === 0)
      errs.dosage = "Dosage is recommended";
    if (!Number.isFinite(form.frequencyPerDay) || form.frequencyPerDay < 1)
      errs.frequencyPerDay = "Frequency per day must be 1 or more";
    if (!form.startDate || isNaN(new Date(form.startDate).getTime()))
      errs.startDate = "Start date is invalid";
    if (!Number.isFinite(form.quantity) || form.quantity <= 0)
      errs.quantity = "Quantity must be a positive number";
    if (!Number.isFinite(form.daysSupply) || form.daysSupply <= 0)
      errs.daysSupply = "Days supply must be a positive number";
    // Consistency check: daysSupply should equal ceil(quantity / frequencyPerDay)
    if (
      Number.isFinite(form.quantity) &&
      Number.isFinite(form.frequencyPerDay) &&
      form.frequencyPerDay > 0
    ) {
      const expected = Math.ceil(form.quantity / form.frequencyPerDay);
      if (form.daysSupply !== expected) {
        errs.daysSupply = `Inconsistent: days supply should be ${expected} (quantity ${form.quantity} / ${form.frequencyPerDay}/day)`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const ok = validate();
    if (!ok) return;
    setSubmitting(true);
    try {
      const url = initial?.id
        ? `/api/medications/${initial.id}`
        : "/api/medications";
      const method = initial?.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `API returned ${res.status}`);
      }
      onSaved && onSaved();
    } catch (err: any) {
      setSubmitError(err?.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function cancel() {
    // If editing, allow parent to close the form without saving
    onCancel && onCancel();
  }

  return (
    <form className="card" onSubmit={submit} noValidate>
      <div>
        <label>Name</label>
        <br />
        <input
          value={form.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, name: e.target.value })
          }
          aria-invalid={!!fieldErrors.name}
        />
        {fieldErrors.name && (
          <div style={{ color: "red" }}>{fieldErrors.name}</div>
        )}
      </div>

      <div>
        <label>Dosage</label>
        <br />
        <input
          value={form.dosage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, dosage: e.target.value })
          }
        />
        {fieldErrors.dosage && (
          <div style={{ color: "red" }}>{fieldErrors.dosage}</div>
        )}
      </div>

      <div>
        <label>Frequency per day</label>
        <br />
        <input
          type="number"
          value={form.frequencyPerDay}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const freq = Number(e.target.value) || 0;
            const qty = Number(form.quantity) || 0;
            const days = freq > 0 ? Math.ceil(qty / freq) : form.daysSupply;
            setForm({ ...form, frequencyPerDay: freq, daysSupply: days });
          }}
        />
        {fieldErrors.frequencyPerDay && (
          <div style={{ color: "red" }}>{fieldErrors.frequencyPerDay}</div>
        )}
      </div>

      <div>
        <label>Start date</label>
        <br />
        <input
          type="date"
          value={form.startDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, startDate: e.target.value })
          }
        />
        {fieldErrors.startDate && (
          <div style={{ color: "red" }}>{fieldErrors.startDate}</div>
        )}
      </div>

      <div>
        <label>Quantity received</label>
        <br />
        <input
          type="number"
          value={form.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const qty = Number(e.target.value) || 0;
            const freq = Number(form.frequencyPerDay) || 0;
            const days = freq > 0 ? Math.ceil(qty / freq) : form.daysSupply;
            setForm({ ...form, quantity: qty, daysSupply: days });
          }}
        />
        {fieldErrors.quantity && (
          <div style={{ color: "red" }}>{fieldErrors.quantity}</div>
        )}
      </div>

      <div>
        <label>Days' supply</label>
        <br />
        <input
          type="number"
          value={form.daysSupply}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, daysSupply: Number(e.target.value) || 0 })
          }
        />
        {fieldErrors.daysSupply && (
          <div style={{ color: "red" }}>{fieldErrors.daysSupply}</div>
        )}
      </div>

      {/* previously there was an assumeTakenUpToNow checkbox shown for past start dates; removed */}

      {submitError && (
        <div style={{ color: "red", marginTop: 8 }}>{submitError}</div>
      )}
      <div style={{ marginTop: 8 }}>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn"
            style={{ marginLeft: 8 }}
            onClick={cancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
