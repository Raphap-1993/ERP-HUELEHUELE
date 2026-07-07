import { Controller, Get, Query } from "@nestjs/common";
import { adminAccessRoles, type MediaAssetKindValue } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { RequireRoles } from "../auth/auth-rbac";
import { MediaService } from "./media.service";

const mediaLibraryRoles = Array.from(
  new Set([
    ...adminAccessRoles.configuration,
    ...adminAccessRoles.cms,
    ...adminAccessRoles.products
  ])
);

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

@RequireRoles(...mediaLibraryRoles)
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
