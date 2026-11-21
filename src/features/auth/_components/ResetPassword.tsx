

import { ResetPasswordForm } from "./ResetPasswordForm";
import { PublicLayout } from "@/components/layouts/public/PublicLayout";

export function ResetPassword({ token }: { token: string }) {
  return (
    <PublicLayout>
      <ResetPasswordForm token={token} />
    </PublicLayout>
  );
}
