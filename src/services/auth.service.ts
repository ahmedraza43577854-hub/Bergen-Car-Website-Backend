import { env } from "../config/env";
import { UnauthorizedError } from "../errors/AppError";
import { passwordsMatch, signDashboardToken } from "../lib/token";
import type { LoginBody } from "../validators/auth.validator";

export class AuthService {
  login(input: LoginBody) {
    const allowed = env.dashboard.emails.includes(input.email);
    const passwordOk = passwordsMatch(input.password, env.dashboard.password);

    if (!allowed || !passwordOk) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    return {
      token: signDashboardToken(input.email),
      email: input.email,
    };
  }
}

export const authService = new AuthService();
