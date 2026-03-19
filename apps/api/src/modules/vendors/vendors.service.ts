import { Injectable } from "@nestjs/common";
import { vendorApplications, VendorApplicationStatus, type VendorApplicationItem } from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";

export interface VendorApplicationInput {
  name: string;
  email: string;
  city: string;
  source?: string;
  message?: string;
}

@Injectable()
export class VendorsService {
  listApplications() {
    return wrapResponse<VendorApplicationItem[]>(vendorApplications);
  }

  submitApplication(body: VendorApplicationInput) {
    const referenceId = `va-${String(vendorApplications.length + 1).padStart(3, "0")}`;

    return {
      ...actionResponse("queued", "La postulación fue registrada y quedará en screening.", referenceId),
      data: {
        id: referenceId,
        name: body.name,
        email: body.email,
        city: body.city,
        status: VendorApplicationStatus.Submitted,
        source: body.source ?? "Formulario web"
      }
    };
  }
}

