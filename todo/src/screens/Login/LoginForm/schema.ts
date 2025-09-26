import * as yup from "yup";

export const loginSchema = yup.object({
  email: yup
    .string()
    .email("E-mail inválido")
    .required("O e-mail é obrigatório"),
  password: yup
    .string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .required("A senha é obrigatória"),
});

export type LoginFormData = yup.InferType<typeof loginSchema>;