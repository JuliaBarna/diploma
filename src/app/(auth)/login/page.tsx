import { Suspense } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { DashboardPreviewCard } from "@/components/auth/DashboardPreviewCard";

export default function LoginPage() {
  return (
    <AuthLayout
      left={
        <Suspense>
          <LoginForm />
        </Suspense>
      }
      right={<DashboardPreviewCard />}
    />
  );
}
