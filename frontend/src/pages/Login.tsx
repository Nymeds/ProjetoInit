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
    <div className="flex items-center justify-center h-screen bg-background-primary">
      <Card variant="primary" size="lg" className="flex flex-col gap-6 w-96">
        <Text variant="heading-medium" className="text-center">
          Login
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Text variant="label-small">Email</Text>
            <input
              {...register("email", { required: "Email obrigatório" })}
              type="email"
              placeholder="Digite seu email"
              className="p-2 rounded bg-background-secondary focus:outline-none"
            />
            {errors.email && (
              <Text variant="paragraph-small" className="text-danger">
                {errors.email.message}
              </Text>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <Text variant="label-small">Senha</Text>
            <input
              {...register("password", { required: "Senha obrigatória" })}
              type="password"
              placeholder="Digite sua senha"
              className="p-2 rounded bg-background-secondary focus:outline-none"
            />
            {errors.password && (
              <Text variant="paragraph-small" className="text-danger">
                {errors.password.message}
              </Text>
            )}
          </div>

          {errorMessage && (
            <Text variant="paragraph-small" className="text-danger text-center">
              {errorMessage}
            </Text>
          )}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          
        </form>
       
      </Card>
    </div>
  );
}
