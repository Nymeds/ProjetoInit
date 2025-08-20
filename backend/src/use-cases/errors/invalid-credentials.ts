export class InvalidCredentials extends Error {
  constructor() {
    super('Usuario não encontrado.')
  }
}
