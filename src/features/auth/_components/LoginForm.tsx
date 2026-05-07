
import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import FormHeading from "@/components/layouts/public/FormHeading";
import {
  email as emailRule,
  minLength,
  required,
  validateField,
} from "@/lib/validation";
import { Button, Input, Wave } from "@/components/ui";
import { Link } from "react-router-dom";
import { useLogin } from "@/hooks/useAuthActions";
import { consumeAuthNotice } from "@/lib/auth-routing";
import { showInfoToast } from "@/lib/toast";

export default function LoginForm() {
  const { mutate: loginAction, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});

  useEffect(() => {
    const notice = consumeAuthNotice();

    if (notice) {
      showInfoToast(notice);
    }
  }, []);

  const validateSingleField = (name: "email" | "password", value: string) => {
    let error: string | null = null;

    if (name === "email")
      error = validateField(value, [required(), emailRule()]);
    if (name === "password")
      error = validateField(value, [required(), minLength(6)]);

    setErrors((prev) => ({ ...prev, [name]: error || undefined }));
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    const emailError = validateField(email, [required(), emailRule()]);
    const passwordError = validateField(password, [required(), minLength(6)]);

    setErrors({
      email: emailError || undefined,
      password: passwordError || undefined,
    });

    setTouched({ email: true, password: true });

    if (emailError || passwordError) return;

    loginAction({ email, password });
  };

  return (
    <div className="grow flex items-center justify-center p-6 md:p-12 lg:p-24">
      <div className="w-full max-w-md">
        <FormHeading
          title="Welcome Back"
          subtitle="Please enter your credentials to access your account."
        />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (touched.email) validateSingleField("email", e.target.value);
              }}
              onBlur={() => {
                setTouched((t) => ({ ...t, email: true }));
                validateSingleField("email", email);
              }}
              error={touched.email ? errors.email : undefined}
            />
          </div>

          <div className="space-y-1.5">
            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              autoComplete="current-password"
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
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <>
                <Wave /> Signing..
              </>
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
