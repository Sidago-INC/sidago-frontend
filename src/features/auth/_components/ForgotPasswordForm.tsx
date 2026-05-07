
import React, { useState } from "react";
import { Input, Button } from "@/components/ui";
import { Link } from "react-router-dom";
import { Wave } from "@/components/ui/Spinner";
import { validateField, required, email as emailRule } from "@/lib/validation";
import { useForgotPassword } from "@/hooks/useAuthActions";
import FormHeading from "@/components/layouts/public/FormHeading";

export function ForgotPasswordForm() {
  const { mutate, isPending } = useForgotPassword();
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [touched, setTouched] = useState<boolean>(false);

  const validateEmail = (value: string) => {
    const err = validateField(value, [required(), emailRule()]);
    setError(err || undefined);
    return err;
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    setTouched(true);

    if (emailError) return;

    mutate(email);
  };

  return (
    <div className="grow flex items-center justify-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-md">
        <FormHeading
          title="Forgot Password"
          subtitle="Enter your email to get password reset link."
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched) validateEmail(e.target.value);
            }}
            onBlur={() => {
              setTouched(true);
              validateEmail(email);
            }}
            error={touched ? error : undefined}
          />

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Wave /> Sending...
              </>
            ) : (
              "Get Reset Link"
            )}
          </Button>
        </form>

        <p className="text-sm text-center mt-2">
          Remember your password?{" "}
          <Link to="/" className="hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
