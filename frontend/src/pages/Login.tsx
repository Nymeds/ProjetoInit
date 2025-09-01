
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

import Card from "../components/baseComponents/card";
import { Text } from "../components/baseComponents/text";
import { Button } from "../components/baseComponents/button";
import Footer from "../components/buildedComponents/Footer";

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
    <div className="flex flex-col justify-between min-h-screen bg-background-primary p-6">

    
      <div className="flex flex-col items-center gap-6 mt-8">
        <motion.img
          src="/logo.png"
          alt="Logo da empresa"
          className="w-28 h-28 object-contain mb-2 drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />

        <Text variant="paragraph-medium" className="text-accent-paragraph mb-6">
          Dashboard do Rafael 2.0
        </Text>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card floating className="flex flex-col gap-8 w-full max-w-md md:max-w-lg p-8 items-center">
            
            <Text variant="heading-medium" className="text-center">
              Login
            </Text>

            <form 
              onSubmit={handleSubmit(onSubmit)} 
              className="flex flex-col gap-6 w-full max-w-md"
              autoComplete="on" 
              noValidate
            >
              <motion.div className="flex flex-col gap-2" 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <label htmlFor="email">
                  <Text variant="label-small">Email</Text>
                </label>
                <input
                  id="email"
                  {...register("email", {
                    required: "Email obrigatório",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Email inválido"
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@exemplo.com"
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="p-4 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition text-lg"
                />
                {errors.email && (
                  <Text id="email-error" variant="paragraph-small" className="text-danger" role="alert">
                    {errors.email.message}
                  </Text>
                )}
              </motion.div>

              <motion.div className="flex flex-col gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <label htmlFor="password">
                  <Text variant="label-small">Senha</Text>
                </label>
                <input
                  id="password"
                  {...register("password", { 
                    required: "Senha obrigatória",
                    minLength: {
                      value: 6,
                      message: "Senha precisa ter no mínimo 6 caracteres"
                    }
                  })}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="p-4 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition text-lg"
                />
                {errors.password && (
                  <Text id="password-error" variant="paragraph-small" className="text-danger" role="alert">
                    {errors.password.message}
                  </Text>
                )}
              </motion.div>

              {errorMessage && (
                <Text variant="paragraph-small" className="text-danger text-center" role="alert">
                  {errorMessage}
                </Text>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button type="submit" variant="primary" disabled={loading} className="w-full py-4 text-lg">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </motion.div>
            </form>
          </Card>
        </motion.div>
      </div>

    
      <Footer />
    </div>
  );
}
