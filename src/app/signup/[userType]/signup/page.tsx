"use client";

import { SignupForm } from "@/components/auth/SignupForm";
import { useParams } from "next/navigation";

export default function InstructorLoginPage() {
  const params = useParams();
  const userTypeFromParams = params.userType as "student" | "instructor";
  return <SignupForm userType={userTypeFromParams} />;
}
