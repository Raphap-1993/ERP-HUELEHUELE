import { BadGatewayException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { CheckoutDocumentIdentitySummary } from "@huelegood/shared";

type ApiPeruDniPayload = {
  success?: boolean;
  message?: string;
  data?: {
    numero?: string;
    nombres?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    codigo_verificacion?: string | number;
  };
};

function toTitleCase(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("es-PE")
    .replace(/\b([a-záéíóúñ])/gu, (match) => match.toLocaleUpperCase("es-PE"));
}

@Injectable()
export class ApiPeruService {
  private readonly baseUrl = process.env.APIPERU_BASE_URL?.trim().replace(/\/$/, "") || "https://apiperu.dev/api";

  private readonly token = process.env.APIPERU_TOKEN?.trim();

  async lookupDni(documentNumber: string): Promise<CheckoutDocumentIdentitySummary | undefined> {
    if (!this.token) {
      throw new ServiceUnavailableException("La integración con ApiPeru no está configurada.");
    }

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}/dni`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.token}`
        },
        body: JSON.stringify({ dni: documentNumber }),
        signal: AbortSignal.timeout(10000)
      });
    } catch (error) {
      throw new BadGatewayException(
        `No pudimos consultar ApiPeru. ${error instanceof Error ? error.message : "Error de red."}`.trim()
      );
    }

    const payload = (await response.json().catch(() => null)) as ApiPeruDniPayload | null;

    if (!response.ok && payload?.success === false && /no se encontraron resultados/i.test(payload.message ?? "")) {
      return undefined;
    }

    if (!response.ok) {
      throw new BadGatewayException(
        payload?.data || payload?.message
          ? `ApiPeru rechazó la consulta de DNI. ${payload.message ?? ""}`.trim()
          : `ApiPeru respondió HTTP ${response.status}.`
      );
    }

    const firstName = payload?.data?.nombres ? toTitleCase(payload.data.nombres) : undefined;
    const paternalLastName = payload?.data?.apellido_paterno ? toTitleCase(payload.data.apellido_paterno) : undefined;
    const maternalLastName = payload?.data?.apellido_materno ? toTitleCase(payload.data.apellido_materno) : undefined;
    const lastName = [paternalLastName, maternalLastName].filter(Boolean).join(" ").trim();

    if (!payload?.success || !firstName || !lastName) {
      return undefined;
    }

    return {
      documentType: "dni",
      documentNumber,
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      verificationDigit:
        payload.data?.codigo_verificacion == null ? undefined : String(payload.data.codigo_verificacion).trim() || undefined,
      source: "apiperu"
    };
  }
}
