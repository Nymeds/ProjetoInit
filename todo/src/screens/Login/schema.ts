import * as yup from "yup";

export type LoginFormData = {
  email: string;
  password: string;
};

export const loginSchema = yup.object({
  email: yup.string().email("Email inválido").required("E-mail é obrigatório"),
  password: yup.string().min(6, "Senha deve ter ao menos 6 caracteres").required("Senha é obrigatória"),
}).required();