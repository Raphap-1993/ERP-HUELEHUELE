import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { adminAccessRoles, type ProductImageUploadInput, type ProductUpsertInput } from "@huelegood/shared";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { RequireRoles } from "../auth/auth-rbac";
import { ProductsService } from "./products.service";

type UploadedFileShape = {
  buffer: Buffer;
  mimetype?: string;
  originalname?: string;
  size?: number;
};

@RequireRoles(...adminAccessRoles.products)
@Controller("admin/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  listProducts() {
    return this.productsService.listAdminProducts();
  }

  @Get("categories")
  listCategories() {
    return this.productsService.listAdminCategories();
  }

  @Get(":id")
  async getProduct(@Param("id") id: string) {
    const product = await this.productsService.getAdminProduct(id);
    if (!product) {
      throw new NotFoundException(`Producto no encontrado: ${id}`);
    }

    return { data: product };
  }

  @Post()
  createProduct(@Body() body: ProductUpsertInput) {
    return this.productsService.createProduct(body);
  }

  @Patch(":id")
  updateProduct(@Param("id") id: string, @Body() body: ProductUpsertInput) {
    return this.productsService.updateProduct(id, body);
  }

  @Post(":id/images")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
      }
    })
  )
  uploadProductImage(
    @Param("id") id: string,
    @UploadedFile() file: UploadedFileShape | undefined,
    @Body() body: ProductImageUploadInput
  ) {
    return this.productsService.uploadProductImage(id, file, body);
  }

  @Delete(":id/images/:imageId")
  deleteProductImage(@Param("id") id: string, @Param("imageId") imageId: string) {
    return this.productsService.deleteProductImage(id, imageId);
  }
}
