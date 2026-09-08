"use client";

import { useEffect, useState } from "react";
import { Timestamp, collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

import { RoleGate } from "@/components/providers/role-gate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { firestore } from "@/lib/firebase-client";

type PharmacyQueueItem = {
  id: string;
  patientNumber: string;
  patientName: string;
  diagnosis: string;
  medications: string;
  requestedBy?: string;
  status: "Pending Dispense" | "Awaiting Lab Result" | "Dispensed";
  createdAt?: Timestamp;
};

function formatCreatedAt(createdAt?: Timestamp) {
  if (!createdAt) return "Just now";

  return createdAt.toDate().toLocaleString();
}

export default function PharmacyPage() {
  const [queue, setQueue] = useState<PharmacyQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setError("Firestore is not configured. Add Firebase keys to .env.local.");
      setLoading(false);
      return;
    }

    const queueQuery = query(
      collection(firestore, "pharmacyQueue"),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      queueQuery,
      (snapshot) => {
        setQueue(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<PharmacyQueueItem, "id">),
          })),
        );
        setLoading(false);
      },
      () => {
        setError("Unable to load pharmacy queue.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <RoleGate roles={["PHARMACIST", "ADMINISTRATOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Dispensing & Payment</h1>
          <p className="text-sm text-muted">
            Fulfill prescriptions, process payments, and close visits.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Prescription Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-xl bg-[#ffe2e2] p-3 text-xs text-danger">{error}</p>
            )}

            {loading ? (
              <p className="text-sm text-muted">Loading pharmacy queue...</p>
            ) : queue.length === 0 ? (
              <p className="text-sm text-muted">No prescriptions yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TH>Patient No.</TH>
                    <TH>Patient</TH>
                    <TH>Diagnosis</TH>
                    <TH>Prescription</TH>
                    <TH>Requested By</TH>
                    <TH>Status</TH>
                    <TH>Created</TH>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} className="border-t border-border">
                      <TD className="font-semibold text-foreground">{item.patientNumber}</TD>
                      <TD>{item.patientName}</TD>
                      <TD>{item.diagnosis}</TD>
                      <TD>{item.medications}</TD>
                      <TD>{item.requestedBy || "Doctor"}</TD>
                      <TD>
                        <Badge
                          variant={
                            item.status === "Dispensed"
                              ? "success"
                              : item.status === "Awaiting Lab Result"
                                ? "warning"
                                : "default"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TD>
                      <TD>{formatCreatedAt(item.createdAt)}</TD>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
