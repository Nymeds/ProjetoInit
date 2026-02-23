import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle, Mail, KeyRound, ShieldCheck } from "lucide-react";

import Card from "../components/baseComponents/card";
import { Text } from "../components/baseComponents/text";
import { Button } from "../components/baseComponents/button";
import { Modal } from "../components/baseComponents/Modal";
import Footer from "../components/buildedComponents/Footer";
import { api, sendTokenVerificationEmail, verifyResetToken } from "../api/auth";


interface EmailFormData {
  email: string;
}
type ModalStep = "token" | "password" | "success";
const REQUIREMENTS = [
  { label: "Mínimo 6 caracteres",      test: (p: string) => p.length >= 6 },
  { label: "Pelo menos uma maiúscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Pelo menos um número",     test: (p: string) => /\d/.test(p) },
];

function strengthOf(password: string) {
  return REQUIREMENTS.filter((r) => r.test(password)).length;
}

const STRENGTH_LABEL = ["", "Fraca", "Média", "Forte"] as const;
const STRENGTH_COLOR = ["", "bg-accent-red", "bg-accent-yellow", "bg-accent-brand"] as const;
export function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>();

  // step 1 – envio de email
  const [emailForReset, setEmailForReset] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [modalOpen, setModalOpen]     = useState(false);

  // modal sub-etapas
  const [modalStep, setModalStep] = useState<ModalStep>("token");

  // step 2a – verificação de token
  const [token, setToken]             = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError]   = useState<string | null>(null);

  // step 2b – nova senha
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [resetLoading, setResetLoading]       = useState(false);
  const [resetError, setResetError]           = useState<string | null>(null);

  const strength = strengthOf(newPassword);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmitReset =
    !resetLoading && strength === 3 && passwordsMatch && confirmPassword.length > 0;

  //  1. envia email 
  async function handleSendEmail(data: EmailFormData) {
    setEmailLoading(true);
    setEmailError("");
    try {
      await sendTokenVerificationEmail(data.email);
      setEmailForReset(data.email);
      setModalStep("token");
      setModalOpen(true);
    } catch (err: any) {
      setEmailError(
        err?.response?.data?.message || err.message || "Erro ao enviar email. Tente novamente."
      );
    } finally {
      setEmailLoading(false);
    }
  }

  //  2a. valida token 
  async function handleVerifyToken(e: React.FormEvent) {
    e.preventDefault();
    setTokenError(null);

    if (!token.trim()) {
      setTokenError("Cole o token recebido no email.");
      return;
    }

    setTokenLoading(true);
    try {
      
     await verifyResetToken(emailForReset,token);
      setModalStep("password"); 
    } catch (err: any) {
      setTokenError(
        err?.response?.data?.message || err.message || "Token inválido ou expirado."
      );
    } finally {
      setTokenLoading(false);
    }
  }

  //  2b. redefine senha 
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);

    if (!passwordsMatch) { setResetError("As senhas não coincidem."); return; }
    if (strength < 3)    { setResetError("A senha não atende todos os requisitos."); return; }

    setResetLoading(true);
    try {
      //  ajuste o endpoint/body conforme seu backend
      console.log(emailForReset)
      await api.patch("/password/reset", { email: emailForReset, token: token.trim(), password: newPassword });
      setModalStep("success");
    } catch (err: any) {
      setResetError(
        err?.response?.data?.message || err.message || "Erro ao redefinir senha."
      );
    } finally {
      setResetLoading(false);
    }
  }

  //  fecha e limpa tudo 
  function handleCloseModal() {
    setModalOpen(false);
    setModalStep("token");
    setToken("");
    setTokenError(null);
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
  }

  //  render 
  return (
    <div className="flex min-h-screen flex-col justify-between bg-background-primary p-6">
      {/* ── Topo ── */}
      <div className="mt-8 flex flex-col items-center gap-6">
        <motion.img
          src="/logo.png"
          alt="Logo"
          className="mb-2 h-28 w-28 object-contain drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        />
        <Text variant="paragraph-medium" className="mb-6 text-accent-paragraph">
          Dashboard
        </Text>

        {/* ── Card de email ── */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card floating className="flex w-full max-w-md flex-col items-center gap-8 p-8 md:max-w-lg">
            <Text variant="heading-medium" className="text-center">
              Esqueci minha senha
            </Text>
            <Text variant="paragraph-small" className="mb-8 text-center text-accent-paragraph">
              Insira seu email para receber o token de redefinição.
            </Text>

            <form
              onSubmit={handleSubmit(handleSendEmail)}
              className="flex w-full max-w-md flex-col gap-6"
              autoComplete="on"
              noValidate
            >
              <motion.div
                className="flex flex-col gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <label htmlFor="email">
                  <Text variant="label-small">Email</Text>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-paragraph/60" />
                  <input
                    id="email"
                    {...register("email", {
                      required: "Email obrigatório",
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email inválido" },
                    })}
                    type="email"
                    autoComplete="email"
                    placeholder="seu@exemplo.com"
                    aria-invalid={errors.email ? "true" : "false"}
                    className="w-full rounded border border-border-primary bg-background-secondary py-4 pl-10 pr-4 text-lg transition focus:outline-none focus:ring-2 focus:ring-accent-brand"
                  />
                </div>
                {errors.email && (
                  <Text variant="paragraph-small" className="text-danger" role="alert">
                    {errors.email.message}
                  </Text>
                )}
              </motion.div>

              {emailError && (
                <Text variant="paragraph-small" className="text-center text-danger" role="alert">
                  {emailError}
                </Text>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  type="submit"
                  variant="primary"
                  disabled={emailLoading}
                  className="w-full py-4 text-lg"
                >
                  {emailLoading ? "Enviando..." : "Enviar token por email"}
                </Button>
              </motion.div>
            </form>
          </Card>
        </motion.div>
      </div>

      <Footer />

      {/* 
          Modal – 3 sub-etapas: token → senha → sucesso
           */}
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title={
          modalStep === "token"    ? "Verificar token" :
          modalStep === "password" ? "Redefinir senha" :
          "Pronto!"
        }
        description={
          modalStep === "token"
            ? "Verifique seu email e cole o token recebido abaixo."
            : modalStep === "password"
            ? "Token verificado. Agora defina sua nova senha."
            : undefined
        }
        className="max-w-md"
        fullScreenOnMobile={false}
        closeOnBackdrop={false}
      >
        {/*  sub-etapa 1: token  */}
        {modalStep === "token" && (
          <form onSubmit={handleVerifyToken} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-token">
                <Text variant="label-small" className="text-heading">Token</Text>
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-paragraph/60" />
                <input
                  id="reset-token"
                  type="text"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setTokenError(null); }}
                  placeholder="Cole o token aqui"
                  autoComplete="off"
                  className="w-full rounded-lg border border-border-primary bg-background-secondary py-2.5 pl-10 pr-4 font-mono text-sm tracking-wider text-label placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-accent-brand"
                />
              </div>

              {tokenError && (
                <div className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2">
                  <Text variant="paragraph-small" className="text-accent-red">
                    {tokenError}
                  </Text>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={tokenLoading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={tokenLoading || !token.trim()}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                {tokenLoading ? "Verificando..." : "Verificar token"}
              </Button>
            </div>
          </form>
        )}

        {/*  sub-etapa 2: senha  */}
        {modalStep === "password" && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            {/* badge de token verificado */}
            <div className="flex items-center gap-2 rounded-lg border border-accent-brand/30 bg-accent-brand/10 px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-accent-brand" />
              <Text variant="paragraph-small" className="text-accent-brand">
                Token verificado com sucesso.
              </Text>
            </div>

            {/* nova senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password">
                <Text variant="label-small" className="text-heading">Nova senha</Text>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-paragraph/60" />
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-border-primary bg-background-secondary py-2.5 pl-10 pr-10 text-sm text-label placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-accent-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-paragraph/60 hover:text-accent-paragraph"
                  aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {newPassword.length > 0 && (
                <div className="mt-1 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= strength ? STRENGTH_COLOR[strength] : "bg-border-primary"
                        }`}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <Text variant="paragraph-small" className="text-accent-paragraph">
                      Força:{" "}
                      <span className="font-medium text-heading">{STRENGTH_LABEL[strength]}</span>
                    </Text>
                  )}
                  <ul className="space-y-1">
                    {REQUIREMENTS.map((req) => (
                      <li
                        key={req.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          req.test(newPassword) ? "text-accent-brand" : "text-accent-paragraph/70"
                        }`}
                      >
                        <span>{req.test(newPassword) ? "✓" : "○"}</span>
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm-password">
                <Text variant="label-small" className="text-heading">Confirmar nova senha</Text>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-paragraph/60" />
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm text-label placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-accent-brand bg-background-secondary ${
                    confirmPassword.length > 0 && !passwordsMatch
                      ? "border-accent-red"
                      : "border-border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-accent-paragraph/60 hover:text-accent-paragraph"
                  aria-label={showConfirm ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text variant="paragraph-small" className="text-accent-red">
                  As senhas não coincidem.
                </Text>
              )}
            </div>

            {resetError && (
              <div className="rounded-lg border border-accent-red/40 bg-accent-red/10 px-3 py-2">
                <Text variant="paragraph-small" className="text-accent-red">
                  {resetError}
                </Text>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={resetLoading}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={!canSubmitReset}>
                {resetLoading ? "Salvando..." : "Redefinir senha"}
              </Button>
            </div>
          </form>
        )}

        {/*  sub-etapa 3: sucesso  */}
        {modalStep === "success" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-brand/15">
              <CheckCircle className="h-8 w-8 text-accent-brand" />
            </div>
            <Text variant="heading-small" className="text-heading">
              Senha redefinida com sucesso!
            </Text>
            <Text variant="paragraph-small" className="text-accent-paragraph">
              Sua nova senha já está ativa. Faça login para continuar.
            </Text>
            <Button
              variant="primary"
              className="mt-2 w-full"
              onClick={() => { handleCloseModal(); window.location.href = "/login"; }}
            >
              Ir para o login
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}