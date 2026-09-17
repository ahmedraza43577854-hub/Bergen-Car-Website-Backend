import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { leadRepository } from "../repositories/lead.repository";
import type { CreateLeadBody } from "../validators/leads.validator";
import { emailService } from "./email.service";

const TYPE_LABEL: Record<CreateLeadBody["type"], string> = {
  contact: "Contact",
  "location-contact": "Homepage contact",
  sell: "Sell your car",
  trade: "Trade-in",
  financing: "Financing / pre-qualification",
  "credit-application": "Credit application",
  "business-application": "Business / fleet application",
  service: "Service appointment",
  "test-drive": "Test drive",
};

function compact(value: string | undefined): string {
  return value?.trim() ?? "";
}

function leadRows(input: CreateLeadBody): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ["Type", TYPE_LABEL[input.type]],
    ["Name", input.name],
    ["Email", compact(input.email)],
    ["Phone", compact(input.phone)],
  ];

  switch (input.type) {
    case "contact":
      rows.push(["Topic", compact(input.topic)], ["Message", compact(input.message)]);
      break;
    case "location-contact":
      rows.push(["Message", compact(input.message)]);
      break;
    case "sell":
    case "trade":
      rows.push(
        ["Year", input.year],
        ["Make", input.make],
        ["Model", input.model],
        ["Trim", compact(input.trim)],
        ["Mileage", input.mileage],
        ["Condition", input.condition],
        ["VIN", compact(input.vin)],
        ["ZIP", compact(input.zip)],
        ["Accidents", compact(input.accidents)],
        ["Paint work", compact(input.paintWork)],
        ["Existing damage", compact(input.existingDamage)],
        ["Lienholder", compact(input.lienholder)],
        ["Notes", compact(input.notes)]
      );
      break;
    case "financing":
      rows.push(
        ["Employment", input.employment],
        ["Income", input.income],
        ["Housing", input.housing],
        ["Credit", input.credit]
      );
      break;
    case "business-application":
      rows.push(
        ["Business name", input.businessName],
        ["Business type", input.businessType],
        ["Tax ID", compact(input.taxId)],
        ["Years in business", compact(input.yearsInBusiness)],
        ["Address", input.address],
        ["City", input.city],
        ["State", compact(input.state)],
        ["ZIP", input.zip],
        ["Fleet size", compact(input.fleetSize)],
        ["Vehicles needed", input.vehicleNeed],
        ["Notes", compact(input.notes)]
      );
      break;
    case "credit-application":
      rows.push(
        ["Date of birth", compact(input.dateOfBirth)],
        ["Address", input.address],
        ["City", input.city],
        ["State", input.state],
        ["ZIP", input.zip],
        ["Housing", input.housing],
        ["Housing payment", compact(input.housingPayment)],
        ["Employment", input.employment],
        ["Employer", compact(input.employer)],
        ["Time employed", compact(input.timeEmployed)],
        ["Income", input.income],
        ["Credit", input.credit],
        ["Co-signer", compact(input.cosigner)],
        ["Purchase timeframe", compact(input.purchaseTimeframe)],
        ["Preferred contact", compact(input.preferredContact)],
        ["Vehicle ID", compact(input.vehicleId)],
        ["Vehicle", compact(input.vehicleDescription)],
        ["Notes", compact(input.notes)],
        ["Full application", compact(input.message)]
      );
      break;
    case "service":
      rows.push(
        ["Date", input.date],
        ["Time", input.time],
        ["Year", compact(input.year)],
        ["Make", compact(input.make)],
        ["Model", compact(input.model)],
        ["Details", compact(input.details)]
      );
      break;
    case "test-drive":
      rows.push(
        ["Date", input.date],
        ["Time", input.time],
        [
          "Vehicle",
          [input.vehicleYear, input.vehicleMake, input.vehicleModel, input.vehicleTrim]
            .filter(Boolean)
            .join(" "),
        ],
        ["Vehicle ID", compact(input.vehicleId)],
        ["Notes", compact(input.notes)]
      );
      break;
  }

  return rows;
}

export class LeadsService {
  async submit(input: CreateLeadBody) {
    const { type, name, email, phone, ...rest } = input;
    const normalizedEmail = compact(email).toLowerCase() || undefined;
    const normalizedPhone = compact(phone) || undefined;

    const lead = await leadRepository.create({
      type,
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      payload: rest as Prisma.InputJsonValue,
    });

    await emailService.send({
      to: env.email.adminRecipients,
      subject: `${TYPE_LABEL[type]} — ${name.trim()}`,
      rows: leadRows(input),
      replyTo: normalizedEmail,
    });

    return {
      success: true as const,
      id: lead.id,
      message: "Your request was received.",
    };
  }
}

export const leadsService = new LeadsService();
