import { Injectable } from "@nestjs/common";
import { WholesaleLeadStatus, wholesaleLeads, type WholesaleLeadItem } from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";

export interface WholesaleLeadInput {
  company: string;
  contact: string;
  email: string;
  city: string;
  notes?: string;
}

@Injectable()
export class WholesaleService {
  listLeads() {
    return wrapResponse<WholesaleLeadItem[]>(wholesaleLeads);
  }

  submitLead(body: WholesaleLeadInput) {
    const referenceId = `wl-${String(wholesaleLeads.length + 1).padStart(3, "0")}`;

    return {
      ...actionResponse("queued", "El lead mayorista fue registrado para seguimiento comercial.", referenceId),
      data: {
        id: referenceId,
        company: body.company,
        contact: body.contact,
        status: WholesaleLeadStatus.New,
        city: body.city,
        source: "Landing mayorista"
      }
    };
  }
}

