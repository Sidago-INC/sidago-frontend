
import React, { useState } from "react";
import { Input, Button } from "@/components/ui";
import { Wave } from "@/components/ui/Spinner";
import { validateField, required, minLength, match } from "@/lib/validation";
import { useResetPassword } from "@/hooks/useAuthActions";
import FormHeading from "@/components/layouts/public/FormHeading";

export function ResetPasswordForm({ token }: { token: string }) {
  const { mutate, isPending } = useResetPassword();
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const [touched, setTouched] = useState<{
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const validateSingleField = (
    field: "password" | "confirmPassword",
    value: string,
  ) => {
    let error: string | null = null;

    if (field === "password") {
      error = validateField(value, [required(), minLength(6)]);
    }

    if (field === "confirmPassword") {
      error = validateField(value, [
        required(),
        match(() => password, "Passwords do not match"),
      ]);
    }

    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    const passwordError = validateField(password, [required(), minLength(6)]);
    const confirmError = validateField(confirmPassword, [
      required(),
      match(() => password, "Passwords do not match"),
    ]);

    setErrors({
      password: passwordError || undefined,
      confirmPassword: confirmError || undefined,
    });

    setTouched({ password: true, confirmPassword: true });

    if (passwordError || confirmError) return;

    if (!token) {
      alert("Invalid or missing token");
      return;
    }

    mutate({ token, newPassword: password });
  };

  return (
    <div className="grow flex items-center justify-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-md">
        <FormHeading
          title="Reset Password"
          subtitle="Enter your new secure password."
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password)
                validateSingleField("password", e.target.value);
            }}
            onBlur={() => {
              setTouched((t) => ({ ...t, password: true }));
              validateSingleField("password", password);
            }}
            error={touched.password ? errors.password : undefined}
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (touched.confirmPassword)
                validateSingleField("confirmPassword", e.target.value);
            }}
            onBlur={() => {
              setTouched((t) => ({
                ...t,
                confirmPassword: true,
              }));
              validateSingleField("confirmPassword", confirmPassword);
            }}
            error={touched.confirmPassword ? errors.confirmPassword : undefined}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Wave /> Resetting...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
