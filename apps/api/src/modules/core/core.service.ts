import { Injectable } from "@nestjs/common";
import { adminDashboard, type DashboardSummary } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

@Injectable()
export class CoreService {
  getOverview() {
    return wrapResponse<DashboardSummary>(adminDashboard, {
      generatedAt: new Date().toISOString()
    });
  }
}

