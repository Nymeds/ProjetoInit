import { useForm } from "react-hook-form";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRegister } from "../hooks/useRegister";
import { useNavigate } from "react-router-dom";

import Card from "../components/baseComponents/card";
import { Text } from "../components/baseComponents/text";
import { Button } from "../components/baseComponents/button";
import Footer from "../components/buildedComponents/Footer";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}

export function Register() {
  const { registerUser, isLoading, errorMessage } = useRegister();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(data: RegisterFormData) {
    try {
      await registerUser(data);
      navigate("/login"); // Só navega se registerUser não lançar erro
    } catch {
      // Não navega, erro já tratado no context
    }
  }

  return (
    <div className="flex flex-col justify-between min-h-screen bg-background-primary p-6">
      
      {/* LOGO E TÍTULO */}
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
          Cadastro de Usuário
        </Text>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card floating className="flex flex-col gap-8 w-full max-w-md md:max-w-lg p-8 items-center">
            
            <Text variant="heading-medium" className="text-center">
              Registro
            </Text>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6 w-full max-w-md"
              autoComplete="on"
              noValidate
            >
              {/* NOME */}
              <motion.div className="flex flex-col gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <label htmlFor="name">
                  <Text variant="label-small">Nome</Text>
                </label>
                <input
                  id="name"
                  {...register("name", { required: "Nome obrigatório" })}
                  type="text"
                  placeholder="Seu nome"
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="p-4 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition text-lg"
                />
                {errors.name && (
                  <Text id="name-error" variant="paragraph-small" className="text-danger" role="alert">
                    {errors.name.message}
                  </Text>
                )}
              </motion.div>

              {/* EMAIL */}
              <motion.div className="flex flex-col gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <label htmlFor="email">
                  <Text variant="label-small">Email</Text>
                </label>
                <input
                  id="email"
                  {...register("email", {
                    required: "Email obrigatório",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" }
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

              {/* SENHA */}
              <motion.div className="flex flex-col gap-2 relative"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label htmlFor="password">
                  <Text variant="label-small">Senha</Text>
                </label>
                <div className="relative w-full">
                  <input
                    id="password"
                    {...register("password", {
                      required: "Senha obrigatória",
                      minLength: { value: 6, message: "Senha precisa ter no mínimo 6 caracteres" }
                    })}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className="p-4 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition text-lg w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-accent cursor-pointer"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.password && (
                  <Text id="password-error" variant="paragraph-small" className="text-danger" role="alert">
                    {errors.password.message}
                  </Text>
                )}
              </motion.div>

              {/* ERRO DO BACKEND */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Text variant="paragraph-small" className="text-danger text-center" role="alert">
                    {errorMessage}
                  </Text>
                </motion.div>
              )}

              {/* BOTÃO DE CADASTRO */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Button type="submit" variant="primary" disabled={isLoading} className="w-full py-4 text-lg">
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
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
