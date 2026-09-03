import { env } from "../config/env";
import { ConflictError } from "../errors/AppError";
import { subscriberRepository } from "../repositories/subscriber.repository";
import { emailService } from "./email.service";

export class NewsletterService {
  async subscribe(email: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await subscriberRepository.findByEmail(normalized);
    if (existing) {
      throw new ConflictError("This email is already on the list.", {
        email: "This email is already on the list.",
      });
    }

    const subscriber = await subscriberRepository.create(normalized);

    await emailService.send({
      to: env.email.adminRecipients,
      subject: `Newsletter signup — ${normalized}`,
      rows: [
        ["Type", "Newsletter"],
        ["Email", normalized],
      ],
      replyTo: normalized,
    });

    return {
      success: true as const,
      id: subscriber.id,
      message: "You're on the list.",
    };
  }
}

export const newsletterService = new NewsletterService();
