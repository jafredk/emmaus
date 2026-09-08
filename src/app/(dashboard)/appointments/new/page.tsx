"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { RoleGate } from "@/components/providers/role-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { patientStatuses } from "@/lib/mock-data";
import { appointmentSchema } from "@/lib/validations";

type AppointmentInput = z.infer<typeof appointmentSchema>;

export default function NewAppointmentPage() {
  const form = useForm<AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patient: "",
      doctor: "",
      department: "",
      appointmentDate: "",
      appointmentTime: "",
      visitType: "",
      reason: "",
      status: "Scheduled",
      notes: "",
    },
  });

  const onSubmit = (values: AppointmentInput) => {
    console.log(values);
    toast.success("Appointment scheduled");
  };

  return (
    <RoleGate roles={["RECEPTIONIST", "ADMINISTRATOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Schedule Appointment</h1>
          <p className="text-sm text-muted">Create, assign, and queue appointments.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            {[
              ["patient", "Patient"],
              ["doctor", "Doctor"],
              ["department", "Department"],
              ["appointmentDate", "Appointment Date"],
              ["appointmentTime", "Appointment Time"],
              ["visitType", "Visit Type"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type={name.includes("Date") ? "date" : name.includes("Time") ? "time" : "text"}
                  {...form.register(name as keyof AppointmentInput)}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="status">Appointment Status</Label>
              <Input id="status" list="statuses" {...form.register("status")} />
              <datalist id="statuses">
                {patientStatuses.map((status) => (
                  <option key={status} value={status} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea id="reason" {...form.register("reason")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register("notes")} />
            </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Save Appointment</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
