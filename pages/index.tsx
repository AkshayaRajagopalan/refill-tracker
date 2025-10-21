import React, { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import MedicationForm from "../src/components/MedicationForm";
import MedicationItem from "../src/components/MedicationItem";
import { calcRemainingDays } from "../lib/calc";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Home() {
  const { data: meds, mutate } = useSWR("/api/medications", fetcher);
  const { mutate: mutateGlobal } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // poll alerts every minute in background
    const t = setInterval(() => fetch("/api/alerts/refills"), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container">
      <h1>Refill Tracker</h1>
      <div className="grid">
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>Medications</h2>
            <button className="btn" onClick={() => setShowForm((s) => !s)}>
              {showForm ? "Close" : "Add Medication"}
            </button>
          </div>

          {showForm && (
            <MedicationForm
              onSaved={() => {
                mutate();
                mutateGlobal("/api/alerts/refills");
                setShowForm(false);
              }}
            />
          )}

          <div>
            {meds?.length === 0 && <p className="muted">No medications yet.</p>}
            {meds?.map((m: any) => (
              <MedicationItem
                key={m.id}
                med={m}
                onChange={() => {
                  mutate();
                  mutateGlobal("/api/alerts/refills");
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="card">
            <h3>Alerts</h3>
            <Alerts />
          </div>

          <div className="card">
            <h3>Quick Add (example)</h3>
            <p className="muted">
              Try adding a sample med: 8 tablets, 2/day, started 2 days ago
            </p>
            <button
              className="btn"
              onClick={async () => {
                await fetch("/api/medications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: "SampleMed",
                    dosage: "10mg",
                    frequencyPerDay: 2,
                    startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000)
                      .toISOString()
                      .slice(0, 10),
                    quantity: 8,
                    daysSupply: 4,
                  }),
                });
                mutate();
                mutateGlobal("/api/alerts/refills");
              }}
            >
              Add Sample
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Alerts() {
  const { data } = useSWR("/api/alerts/refills", fetcher, {
    refreshInterval: 60_000,
  });
  if (!data) return <p className="muted">Loading...</p>;
  if (data.length === 0) return <p>No refills needed in next 7 days.</p>;
  return (
    <div>
      {data.map((m: any) => (
        <div key={m.id} style={{ marginBottom: 8 }}>
          <strong>{m.name}</strong>
          <div className="muted">
            {(() => {
              const daysLeft = calcRemainingDays(m);
              if (daysLeft <= 0)
                return `Refill overdue by ${Math.abs(daysLeft)} day${
                  Math.abs(daysLeft) > 1 ? "s" : ""
                }`;
              return `Refill in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`;
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}
