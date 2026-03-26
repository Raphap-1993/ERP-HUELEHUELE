import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { CommerceService } from "./commerce.service";
import { MediaService } from "../media/media.service";
import type { CheckoutQuoteInput, CheckoutRequestInput } from "@huelegood/shared";

@Controller("store/checkout")
export class CommerceController {
  constructor(
    private readonly commerceService: CommerceService,
    private readonly mediaService: MediaService
  ) {}

  @Post("quote")
  quote(@Body() body: CheckoutQuoteInput) {
    return this.commerceService.quote(body);
  }

  @Post("openpay")
  openpay(@Body() body: CheckoutRequestInput) {
    return this.commerceService.createOpenpayCheckout(body);
  }

  @Post("manual")
  manual(@Body() body: CheckoutRequestInput) {
    return this.commerceService.createManualCheckout(body);
  }

  @Post("evidence")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 }
    })
  )
  async uploadEvidence(
    @UploadedFile() file: { buffer: Buffer; mimetype?: string; originalname?: string } | undefined
  ) {
    if (!file?.buffer) {
      throw new BadRequestException("Debes adjuntar una imagen del comprobante.");
    }
    const result = await this.mediaService.uploadImage(file, {
      kind: "evidence",
      slug: `yape-${Date.now()}`
    });
    return { url: result.url };
  }
}
