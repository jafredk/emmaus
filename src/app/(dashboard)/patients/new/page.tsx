"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { RoleGate } from "@/components/providers/role-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { firestore } from "@/lib/firebase-client";
import { patientSchema } from "@/lib/validations";

type PatientInput = z.infer<typeof patientSchema>;

function generatePatientNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const r = Math.floor(Math.random() * 9000) + 1000;

  return `PT-${y}${m}${d}-${r}`;
}

function getFirestoreErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const firestoreError = error as { code?: string; message?: string };

    if (firestoreError.code === "permission-denied") {
      return "Permission denied by Firestore rules. Ensure your Firebase account has the expected role claim or matching email pattern.";
    }

    if (firestoreError.code === "unauthenticated") {
      return "Firebase Auth session is missing. Sign in again and retry.";
    }

    if (firestoreError.message) {
      return firestoreError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to register patient. Please try again.";
}

export default function NewPatientPage() {
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "Male",
      nationalId: "",
      phoneNumber: "",
      email: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      bloodGroup: "",
      knownAllergies: "",
      insuranceProvider: "",
      insuranceMembershipNumber: "",
      nextOfKin: "",
    },
  });

  const onSubmit = async (values: PatientInput) => {
    if (!firestore) {
      toast.error("Firestore is not configured. Add Firebase keys to .env.local.");
      return;
    }

    if (!user) {
      toast.error("You must be signed in with Firebase Auth before adding patients.");
      return;
    }

    try {
      toast.info(`Debug Auth: uid=${user.uid}, email=${user.email || "(none)"}`);

      const patientNumber = generatePatientNumber();

      const payload = {
        ...values,
        email: values.email || null,
        knownAllergies: values.knownAllergies || null,
        insuranceProvider: values.insuranceProvider || null,
        insuranceMembershipNumber: values.insuranceMembershipNumber || null,
        patientNumber,
        createdByUid: user.uid,
        createdByEmail: user.email,
      };

      await addDoc(collection(firestore, "patients"), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      form.reset({
        firstName: "",
        middleName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "Male",
        nationalId: "",
        phoneNumber: "",
        email: "",
        address: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        bloodGroup: "",
        knownAllergies: "",
        insuranceProvider: "",
        insuranceMembershipNumber: "",
        nextOfKin: "",
      });

      toast.success(`Patient registered. Number: ${patientNumber}`);
      router.push("/patients");
    } catch (error) {
      toast.error(getFirestoreErrorMessage(error));
    }
  };

  return (
    <RoleGate roles={["RECEPTIONIST", "ADMINISTRATOR"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Register New Patient</h1>
          <p className="text-sm text-muted">
            Patient number is generated automatically when submitted.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Patient Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            {[
              ["firstName", "First Name"],
              ["middleName", "Middle Name"],
              ["lastName", "Last Name"],
              ["dateOfBirth", "Date of Birth"],
              ["nationalId", "National ID / Passport"],
              ["phoneNumber", "Phone Number"],
              ["email", "Email Address"],
              ["address", "Residential Address"],
              ["emergencyContactName", "Emergency Contact Name"],
              ["emergencyContactPhone", "Emergency Contact Phone"],
              ["bloodGroup", "Blood Group"],
              ["insuranceProvider", "Insurance Provider"],
              ["insuranceMembershipNumber", "Insurance Membership Number"],
              ["nextOfKin", "Next of Kin"],
            ].map(([name, label]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  type={name === "dateOfBirth" ? "date" : "text"}
                  {...form.register(name as keyof PatientInput)}
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input id="gender" placeholder="Male / Female / Other" {...form.register("gender")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="knownAllergies">Known Allergies</Label>
              <Textarea id="knownAllergies" {...form.register("knownAllergies")} />
            </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => toast("Draft saved")}>Save Draft</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Register Patient"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
