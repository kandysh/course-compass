"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useParams } from "next/navigation";

export default function InstructorLoginPage() {
  const params = useParams();
  const userTypeFromParams = params.userType as "student" | "instructor";
  return <LoginForm userType={userTypeFromParams} />;
}
