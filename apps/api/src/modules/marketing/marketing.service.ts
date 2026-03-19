import { Injectable } from "@nestjs/common";
import { campaignSummary } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

@Injectable()
export class MarketingService {
  listCampaigns() {
    return wrapResponse(campaignSummary);
  }
}

