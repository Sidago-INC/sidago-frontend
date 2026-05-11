import { useSearchParams, Navigate } from "react-router-dom";
import { ResetPassword } from "@/features/auth/_components/ResetPassword";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <ResetPassword token={token} />;
}
