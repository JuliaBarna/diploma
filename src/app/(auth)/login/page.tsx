import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { DashboardPreviewCard } from "@/components/auth/DashboardPreviewCard";

export default function LoginPage() {
  return (
    <AuthLayout
      left={<LoginForm />}
      right={<DashboardPreviewCard />}
    />
  );
}