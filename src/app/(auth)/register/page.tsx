import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { FeaturesPanel } from "@/components/auth/FeaturesPanel";

export default function RegisterPage() {
  return (
    <AuthLayout
      left={<RegisterForm />}
      right={<FeaturesPanel />}
      leftWidth={460}
    />
  );
}