import { Injectable } from "@nestjs/common";
import { loyaltyOverview } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

@Injectable()
export class LoyaltyService {
  getSummary() {
    return wrapResponse(loyaltyOverview[0] ?? null);
  }
}

