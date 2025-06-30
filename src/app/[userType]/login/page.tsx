"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useParams, notFound } from "next/navigation";

export default function LoginPage() {
  const params = useParams();
  const userType = params.userType as string;

  if (userType !== "student" && userType !== "instructor") {
    notFound();
  }

  return <LoginForm userType={userType} />;
}
