"use client";

import { useEffect, useState } from "react";
import { Timestamp, collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

import { RoleGate } from "@/components/providers/role-gate";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TD, TH } from "@/components/ui/table";
import { firestore } from "@/lib/firebase-client";

type LabRequest = {
  id: string;
  patientNumber: string;
  patientName: string;
  testType: string;
  diagnosis: string;
  status: "Pending" | "In Progress" | "Completed";
  createdAt?: Timestamp;
};

function formatCreatedAt(createdAt?: Timestamp) {
  if (!createdAt) return "Just now";

  return createdAt.toDate().toLocaleString();
}

export default function LaboratoryPage() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore) {
      setError("Firestore is not configured. Add Firebase keys to .env.local.");
      setLoading(false);
      return;
    }

    const requestsQuery = query(
      collection(firestore, "labRequests"),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        setRequests(
          snapshot.docs.map((entry) => ({
            id: entry.id,
            ...(entry.data() as Omit<LabRequest, "id">),
          })),
        );
        setLoading(false);
      },
      () => {
        setError("Unable to load lab requests.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <RoleGate roles={["LAB_TECHNICIAN", "DOCTOR", "ADMINISTRATOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Laboratory Queue</h1>
          <p className="text-sm text-muted">
            Receive test requests, upload results, and mark critical findings.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Processing Board</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-xl bg-[#ffe2e2] p-3 text-xs text-danger">{error}</p>
            )}

            {loading ? (
              <p className="text-sm text-muted">Loading lab requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-muted">No lab requests yet.</p>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <TH>Patient No.</TH>
                    <TH>Patient</TH>
                    <TH>Test Type</TH>
                    <TH>Diagnosis</TH>
                    <TH>Status</TH>
                    <TH>Requested</TH>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-t border-border">
                      <TD className="font-semibold text-foreground">{request.patientNumber}</TD>
                      <TD>{request.patientName}</TD>
                      <TD>{request.testType}</TD>
                      <TD>{request.diagnosis}</TD>
                      <TD>
                        <Badge
                          variant={
                            request.status === "Completed"
                              ? "success"
                              : request.status === "In Progress"
                                ? "warning"
                                : "default"
                          }
                        >
                          {request.status}
                        </Badge>
                      </TD>
                      <TD>{formatCreatedAt(request.createdAt)}</TD>
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
