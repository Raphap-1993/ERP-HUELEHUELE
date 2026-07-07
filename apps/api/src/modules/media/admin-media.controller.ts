import { Controller, Get, Query } from "@nestjs/common";
import { adminModulePermissions, type MediaAssetKindValue } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { RequirePermissions } from "../auth/auth-rbac";
import { MediaService } from "./media.service";

function normalizeKind(value?: string): MediaAssetKindValue | undefined {
  if (
    value === "product" ||
    value === "hero" ||
    value === "banner" ||
    value === "logo" ||
    value === "evidence"
  ) {
    return value;
  }

  return undefined;
}

@RequirePermissions(...adminModulePermissions.configuration.read)
@Controller("admin/media")
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get("assets")
  async listAssets(@Query("kind") kind?: string, @Query("limit") limit?: string) {
    const parsedLimit = limit ? Number(limit) : undefined;
    const assets = await this.mediaService.listAssets({
      kind: normalizeKind(kind),
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined
    });

    return wrapResponse(assets, {
      total: assets.length,
      kind: normalizeKind(kind) ?? "all"
    });
  }
}
