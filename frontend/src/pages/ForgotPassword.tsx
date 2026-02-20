import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";

import Card from "../components/baseComponents/card";
import { Text } from "../components/baseComponents/text";
import { Button } from "../components/baseComponents/button";
import Footer from "../components/buildedComponents/Footer";


interface ForgotPasswordFormData {
  email: string;
}
interface ForgotPasswordFormDataToken {
  token: string;
}

function TokenModal({
  onClose,
  onVerified,
}: {
  onClose: () => void;
  onVerified: (token: string) => void;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const { recoverPassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState<"email" | "verifyToken" | "resetPassword">("email");
  const [token, setToken] = useState("");
  async function verify() {
    setLoading(true);

    // chama backend para validar token
    await fetch("/verify-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: value }),
    });

    setLoading(false);
    onVerified(value);
  }

  async function onSubmit(data: ForgotPasswordFormDataToken) {
    setLoading(true);
    setErrorMessage("");
    try {
      await recoverPassword(data.token);
      setStep("verifyToken");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao enviar email de redefinição de senha");
    } finally {
      setLoading(false);
    }
  }

  return (
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
          Dashboard
        </Text>

        {/* CARD DO FORMULÁRIO */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card floating className="flex flex-col gap-8 w-full max-w-md md:max-w-lg p-8 items-center">

            <Text variant="heading-medium" className="text-center">
              Esqueci minha senha
            </Text>

            <Text variant="paragraph-small" className="text-center gap-2 mb-8 text-accent-paragraph">
              Insira seu email para redefinir sua senha.
            </Text>

            {/* FORMULÁRIO */}
            <form 
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6 w-full max-w-md"
              autoComplete="on"
              noValidate
            >

              {/* EMAIL */}
              <motion.div className="flex flex-col gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <label htmlFor="text">
                  <Text variant="label-small">Token</Text>
                </label>
                <input
                  id="text"
                  {...register("token", {
                    required: "Token obrigatório",
                  })}
                  type="email"
                  autoComplete="email"
                  placeholder="seu@exemplo.com"
                  aria-invalid={errors.token ? "true" : "false"}
                  aria-describedby={errors.token ? "token-error" : undefined}
                  className="p-4 rounded bg-background-secondary border border-border-primary focus:outline-none focus:ring-2 focus:ring-accent-brand transition text-lg"
                />
                {errors.token && (
                  <Text id="token-error" variant="paragraph-small" className="text-danger" role="alert">
                    {errors.token.message}
                  </Text>
                )}
              </motion.div>

     
              {/* MENSAGEM DE ERRO */}
              {errorMessage && (
                <Text variant="paragraph-small" className="text-danger text-center" role="alert">
                  {errorMessage}
                </Text>
              )}

              {/* BOTÃO DE ENTRAR */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button type="submit" variant="primary" disabled={loading} className="w-full py-4 text-lg">
                  {loading ? "Enviando..." : "Enviar email de redefinição"}
                </Button>
              </motion.div>

            </form>
          </Card>
        </motion.div>
      </div>

  );
}


function ResetPasswordModal({
  token,
  onClose,
}: {
  token: string;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setLoading(true);

    await fetch("/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);
    alert("Senha alterada com sucesso!");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Nova senha</h2>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-3 rounded w-full mb-4"
          placeholder="Digite a nova senha"
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="bg-green-600 text-white p-3 rounded w-full"
        >
          {loading ? "Salvando..." : "Salvar senha"}
        </button>
      </div>
    </div>
  );
}


export function ForgotPassword() {
  const { recoverPassword } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [step, setStep] = useState<"email" | "verifyToken" | "resetPassword">("email");
  const [token, setToken] = useState("");

  async function onSubmit(data: ForgotPasswordFormData) {
    setLoading(true);
    setErrorMessage("");
    try {
      await recoverPassword(data.email);
      setStep("verifyToken");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao enviar email de redefinição de senha");
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
    {/* MODAL DE VERIFICAÇÃO DE TOKEN */}
  {step === "verifyToken" && (
    <TokenModal
      onClose={() => setStep("email")}
      onVerified={(typedToken) => {
        setToken(typedToken);
        setStep("resetPassword");
      }}
    />
  )}

  {/* MODAL DE RESET DE SENHA */}
  {step === "resetPassword" && (
    <ResetPasswordModal
      token={token}
      onClose={() => setStep("email")}
    />
  )}
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
          Dashboard
        </Text>

        {/* CARD DO FORMULÁRIO */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card floating className="flex flex-col gap-8 w-full max-w-md md:max-w-lg p-8 items-center">

            <Text variant="heading-medium" className="text-center">
              Esqueci minha senha
            </Text>

            <Text variant="paragraph-small" className="text-center gap-2 mb-8 text-accent-paragraph">
              Insira seu email para redefinir sua senha.
            </Text>

            {/* FORMULÁRIO */}
            <form 
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-6 w-full max-w-md"
              autoComplete="on"
              noValidate
            >

              {/* EMAIL */}
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

     
              {/* MENSAGEM DE ERRO */}
              {errorMessage && (
                <Text variant="paragraph-small" className="text-danger text-center" role="alert">
                  {errorMessage}
                </Text>
              )}

              {/* BOTÃO DE ENTRAR */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button type="submit" variant="primary" disabled={loading} className="w-full py-4 text-lg">
                  {loading ? "Enviando..." : "Enviar email de redefinição"}
                </Button>
              </motion.div>

            </form>
          </Card>
        </motion.div>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
    </>
  );

}
