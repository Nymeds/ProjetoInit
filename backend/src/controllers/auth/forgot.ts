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
      from: `"Seu App" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Recuperação de senha",
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px 0;">
        <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="background: #4f46e5; padding: 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px;">Recuperação de Senha</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; text-align: center;">
              <p style="font-size: 16px; color: #333;">
                Olá, ${user.name || "usuário"} 👋
              </p>

              <p style="font-size: 14px; color: #555;">
                Recebemos uma solicitação para redefinir sua senha.
                Clique no botão abaixo para continuar.
              </p>

              

              <p style="margin-top: 30px; font-size: 12px; color: #888;">
                Use seu código para recuperação e nova senha :D
              </p>

              <div style="
                font-size: 20px;
                font-weight: bold;
                letter-spacing: 3px;
                margin-top: 10px;
                color: #111;
              ">
                ${token}
              </div>

              <p style="margin-top: 30px; font-size: 12px; color: #999;">
                Se você não solicitou essa alteração, ignore este email.
              </p>
            </td>
          </tr>
        </table>
      </div>
      `,
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

export async function verifyResetToken(req: any, reply: any) {
  const { token } = req.body;

  const usersRepository = new PrismaUsersRepository();
  const forgotPasswordUseCase = new ForgotPasswordUseCase(usersRepository);

  try {
    const { user } = await forgotPasswordUseCase.verify(token);

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    return reply.status(200).send({
      message: "Token válido",
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Erro ao verificar token",
    });
  }
}
export async function resetPassword(req: any, reply: any) {
  const { token, password } = req.body;

  const usersRepository = new PrismaUsersRepository();
  const forgotPasswordUseCase = new ForgotPasswordUseCase(usersRepository);

  try {
    const { user } = await forgotPasswordUseCase.verify(token);

    if (!user) {
      return reply.status(404).send({ message: "User not found" });
    }

    await usersRepository.updatePassword(user.id, password);

    return reply.status(200).send({
      message: "Senha atualizada com sucesso",
    });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({
      message: "Erro ao atualizar senha",
    });
  }
}