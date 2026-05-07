
import { useSearchParams, Navigate } from "react-router-dom";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { PublicLayout } from "@/components/layouts/public/PublicLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return (
    <PublicLayout>
      <ResetPasswordForm token={token} />
    </PublicLayout>
  );
}
