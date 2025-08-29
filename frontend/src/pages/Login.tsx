// src/pages/Login.tsx
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import  Card  from "../components/card";
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
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <Card variant="primary" size="lg" className="flex flex-col gap-6 w-96">
        <Text size="xl" weight="bold" className="text-center">Login</Text>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <input
            {...register("email", { required: "Email obrigatório" })}
            type="email"
            placeholder="Email"
            className="p-2 rounded bg-gray-800 focus:outline-none"
          />
          {errors.email && <Text color="danger">{errors.email.message}</Text>}

          <input
            {...register("password", { required: "Senha obrigatória" })}
            type="password"
            placeholder="Senha"
            className="p-2 rounded bg-gray-800 focus:outline-none"
          />
          {errors.password && <Text color="danger">{errors.password.message}</Text>}

          {errorMessage && <Text color="danger" className="text-center">{errorMessage}</Text>}

          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
