import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { RegisterUserUseCase } from '../../../application/usecases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../../application/usecases/LoginUserUseCase';
import { UserRepository } from '../../database/repositories/UserRepository';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-do-not-use-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

/**
 * Plugin de Fastify: Rutas de Autenticación.
 *
 * Registra las rutas públicas de Auth bajo el prefijo definido en el servidor.
 * Aquí se ensambla la cadena de dependencias (Composition):
 *   Repository → Use Cases → Controller → Rutas
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // --- Composition (Inyección de Dependencias manual) ---
  const userRepository = new UserRepository();
  const registerUseCase = new RegisterUserUseCase(userRepository);
  const loginUseCase = new LoginUserUseCase(userRepository, JWT_SECRET, JWT_EXPIRES_IN);
  const authController = new AuthController(registerUseCase, loginUseCase);

  // --- Rutas Públicas (no requieren JWT) ---

  fastify.post('/register', async (request, reply) => {
    return authController.register(request, reply);
  });

  fastify.post('/login', async (request, reply) => {
    return authController.login(request, reply);
  });
}
