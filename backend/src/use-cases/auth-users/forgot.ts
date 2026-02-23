import { UsersRepository } from "@/repositories/users-repository.js";
import crypto from "crypto";
import { hash } from 'bcryptjs'
export class ForgotPasswordUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute(email: string) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return { user: null };
    }

    const token = crypto.randomBytes(3).toString("hex"); 
    // 6 caracteres hex (ex: a3f9c1)

    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutos

    await this.usersRepository.updateResetToken(
      user.id,
      token,
      expires
    );
   
    return { user, token };
  }
  async verify(email: string, token: string) {
    const user = await this.usersRepository.findByResetToken(email,token);
    return { user };
  }
  async updatePassword(userId: string, newPassword: string) {
    //hash de senha deve ser feito no controller, aqui só atualiza a senha
       const password_hash = await hash(newPassword, 6)
    await this.usersRepository.updatePassword(userId, password_hash);
  }
}
