// src/pages/Login.tsx
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

import Card from "../components/card";
import { Text } from "../components/text";
import { Button } from "../components/button";

interface LoginFormData {
  email: string;
  password: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function onSubmit(data: LoginFormData) {
    setLoading(true);
    setErrorMessage("");
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao logar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-primary p-6">
      <Card floating className="flex flex-col gap-6 w-full max-w-md p-8">
        <Text variant="heading-medium" className="text-center">
          Login
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" autoComplete="on" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="email">
              <Text variant="label-small">Email</Text>
            </label>
            <input
              id="email"
              {...register("email", { required: "Email obrigatório" })}
              type="email"
              autoComplete="email"
              placeholder="seu@exemplo.com"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="p-3 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition"
            />
            {errors.email && (
              <Text id="email-error" variant="paragraph-small" className="text-danger" role="alert">
                {errors.email.message}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password">
              <Text variant="label-small">Senha</Text>
            </label>
            <input
              id="password"
              {...register("password", { required: "Senha obrigatória" })}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="p-3 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition"
            />
            {errors.password && (
              <Text id="password-error" variant="paragraph-small" className="text-danger" role="alert">
                {errors.password.message}
              </Text>
            )}
          </div>

          {errorMessage && (
            <Text variant="paragraph-small" className="text-danger text-center" role="alert">
              {errorMessage}
            </Text>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="w-full">
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
