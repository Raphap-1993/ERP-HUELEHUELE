import { Injectable } from "@nestjs/common";
import { commissionRows } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

@Injectable()
export class CommissionsService {
  listCommissions() {
    return wrapResponse(commissionRows, {
      total: commissionRows.length
    });
  }
}

