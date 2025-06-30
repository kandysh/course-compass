"use client";

import { SignupForm } from "@/components/auth/SignupForm";
import { useParams, notFound } from "next/navigation";

export default function SignupPage() {
  const params = useParams();
  const userType = params.userType as string;

  if (userType !== "student" && userType !== "instructor") {
    notFound();
  }

  return <SignupForm userType={userType} />;
}
