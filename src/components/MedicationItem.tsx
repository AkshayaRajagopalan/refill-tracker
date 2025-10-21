import React, { useState } from "react";
import {
  calcRemainingDoses,
  calcRemainingDays,
  calcNextRefillDate,
  calcAdherencePercent,
  calcRecordedTodayCount,
} from "../../lib/calc";
import MedicationForm from "./MedicationForm";

export default function MedicationItem({ med, onChange }: any) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const remaining = calcRemainingDoses(med);
  const daysLeft = calcRemainingDays(med);
  const nextRefill = calcNextRefillDate(med);
  const adherence = calcAdherencePercent(med);
  const recordedToday = calcRecordedTodayCount(med);
  const maxPerDayReached = recordedToday >= (med.frequencyPerDay || 1);

  async function del() {
    if (!confirm("Delete medication?")) return;
    try {
      setBusy(true);
      const res = await fetch(`/api/medications/${med.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      onChange();
    } catch (err: any) {
      alert("Delete failed: " + (err?.message || "unknown"));
    } finally {
      setBusy(false);
    }
  }

  async function markTaken() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      setBusy(true);
      const existing: any[] = med.doses || [];
      const perDay = med.frequencyPerDay || 1;
      const todayCount = existing.filter((d: any) => d.date === today).length;
      if (todayCount >= perDay) {
        // nothing to do (or could show a message)
        return;
      }
      const newDoses = [...existing, { date: today, taken: true }];
      const payload = { doses: newDoses };
      const res = await fetch(`/api/medications/${med.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Mark taken failed");
      onChange();
    } catch (err: any) {
      alert(err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  async function markMissed() {
    const today = new Date().toISOString().slice(0, 10);
    try {
      setBusy(true);
      const existing: any[] = med.doses || [];
      const perDay = med.frequencyPerDay || 1;
      const todayCount = existing.filter((d: any) => d.date === today).length;
      if (todayCount >= perDay) {
        return;
      }
      const newDoses = [...existing, { date: today, taken: false }];
      const payload = { doses: newDoses };
      const res = await fetch(`/api/medications/${med.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Mark missed failed");
      onChange();
    } catch (err: any) {
      alert(err?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>{med.name}</strong> <div className="muted">{med.dosage}</div>
        </div>
        <div>
          {daysLeft <= 0 ? (
            <span style={{ color: "red" }}>Refill overdue</span>
          ) : daysLeft <= 7 ? (
            <span style={{ color: "#e65100" }}>Running low</span>
          ) : (
            <span style={{ color: "#2e7d32" }}>On track</span>
          )}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        {(() => {
          const percentRemaining =
            med.quantity > 0
              ? Math.max(
                  0,
                  Math.min(100, Math.round((remaining / med.quantity) * 100))
                )
              : 0;
          return (
            <div className="progress">
              <div style={{ width: `${percentRemaining}%` }}></div>
            </div>
          );
        })()}
        <div className="muted">
          {remaining} doses remaining — next refill: {nextRefill}
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          className="btn"
          onClick={markTaken}
          disabled={busy || maxPerDayReached}
        >
          {busy ? "Working..." : "Mark taken"}
        </button>
        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={markMissed}
          disabled={busy || maxPerDayReached}
        >
          {busy ? "Working..." : "Mark missed"}
        </button>
        <button
          className="btn"
          style={{ marginLeft: 8 }}
          onClick={() => setEditing((e) => !e)}
          disabled={busy}
        >
          {editing ? "Close" : "Edit"}
        </button>
        <button
          className="btn btn-danger"
          style={{ marginLeft: 8 }}
          onClick={del}
          disabled={busy}
        >
          {busy ? "Working..." : "Delete"}
        </button>
      </div>

      {editing && (
        <div style={{ marginTop: 8 }}>
          <MedicationForm
            initial={med}
            onSaved={() => {
              setEditing(false);
              onChange();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <div style={{ marginTop: 8 }} className="muted">
        Adherence: {adherence}%
      </div>
    </div>
  );
}
