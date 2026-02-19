import { transporter } from "../../middlewares/mailer.js";
import { PrismaUsersRepository } from "@/repositories/prisma/prisma-users-repository.js";
import { ForgotPasswordUseCase } from "@/use-cases/auth-users/forgot.js";

export async function forgotPassword(req: any, reply: any) {
  const { email } = req.body;

  const usersRepository = new PrismaUsersRepository();
  const forgotPasswordUseCase = new ForgotPasswordUseCase(usersRepository);

  try {
    const { user, token } = await forgotPasswordUseCase.execute(email);

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Recuperação de senha",
      html: `<h1>${token}</h1>`,
    });

    return reply.status(200).send({
      message: "Email de recuperação enviado",
    });

  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Erro ao enviar email",
    });
  }
}
