import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { type CouponInput, type CouponSummary } from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { ModuleStateService } from "../../persistence/module-state.service";

interface CouponRecord extends CouponSummary {}

interface CouponsSnapshot {
  coupons: CouponRecord[];
}

const demoCouponCodes = new Set(["RESET10", "DUPLO15", "WELCOME5"]);

function nowIso() {
  return new Date().toISOString();
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() ?? "";
}

@Injectable()
export class CouponsService implements OnModuleInit {
  private readonly coupons = new Map<string, CouponRecord>();

  constructor(private readonly moduleStateService: ModuleStateService) {
    if (!isProductionRuntime()) {
      this.seedData();
    }
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<CouponsSnapshot>("coupons");
    if (snapshot?.coupons?.length) {
      for (const coupon of snapshot.coupons) {
        this.coupons.set(coupon.code, coupon);
      }
    }
  }

  private seedData() {
    const seed: CouponRecord[] = [
      {
        code: "RESET10",
        discountType: "percentage",
        discountValue: 10,
        description: "10% de descuento en cualquier pedido",
        conditions: undefined,
        isActive: true,
        usageCount: 0,
        createdAt: "2025-01-01T00:00:00.000Z"
      },
      {
        code: "DUPLO15",
        discountType: "percentage",
        discountValue: 15,
        description: "15% de descuento en el Combo Dúo Perfecto",
        conditions: "combo-duo-perfecto",
        isActive: true,
        usageCount: 0,
        createdAt: "2025-01-01T00:00:00.000Z"
      },
      {
        code: "WELCOME5",
        discountType: "percentage",
        discountValue: 5,
        description: "5% de descuento de bienvenida",
        conditions: undefined,
        isActive: true,
        usageCount: 0,
        createdAt: "2025-01-01T00:00:00.000Z"
      }
    ];

    for (const coupon of seed) {
      this.coupons.set(coupon.code, coupon);
    }
  }

  private async persist() {
    await this.moduleStateService.save<CouponsSnapshot>("coupons", {
      coupons: Array.from(this.coupons.values())
    });
  }

  listCoupons() {
    const coupons = Array.from(this.coupons.values()).sort((a, b) => a.code.localeCompare(b.code));
    return wrapResponse(coupons, { total: coupons.length });
  }

  getCoupon(code: string) {
    const normalized = normalizeCode(code);
    const coupon = this.coupons.get(normalized);
    if (!coupon) throw new NotFoundException(`Cupón ${normalized} no encontrado.`);
    return wrapResponse(coupon);
  }

  async createCoupon(input: CouponInput) {
    const code = normalizeCode(input.code);
    if (!code) throw new BadRequestException("El código del cupón es obligatorio.");
    if (this.coupons.has(code)) throw new ConflictException(`El cupón ${code} ya existe.`);

    const coupon: CouponRecord = {
      code,
      discountType: input.discountType,
      discountValue: input.discountValue,
      description: input.description,
      conditions: input.conditions,
      isActive: input.isActive ?? true,
      usageCount: 0,
      createdAt: nowIso()
    };

    this.coupons.set(code, coupon);
    await this.persist();
    return wrapResponse(coupon);
  }

  async updateCoupon(code: string, input: Partial<CouponInput>) {
    const normalized = normalizeCode(code);
    const existing = this.coupons.get(normalized);
    if (!existing) throw new NotFoundException(`Cupón ${normalized} no encontrado.`);

    const updated: CouponRecord = {
      ...existing,
      discountType: input.discountType ?? existing.discountType,
      discountValue: input.discountValue ?? existing.discountValue,
      description: input.description ?? existing.description,
      conditions: "conditions" in input ? input.conditions : existing.conditions,
      isActive: input.isActive ?? existing.isActive
    };

    this.coupons.set(normalized, updated);
    await this.persist();
    return wrapResponse(updated);
  }

  async deleteCoupon(code: string) {
    const normalized = normalizeCode(code);
    if (!this.coupons.has(normalized)) throw new NotFoundException(`Cupón ${normalized} no encontrado.`);
    if (demoCouponCodes.has(normalized)) throw new BadRequestException("Los cupones de ejemplo no pueden eliminarse.");
    this.coupons.delete(normalized);
    await this.persist();
    return actionResponse("ok", `Cupón ${normalized} eliminado.`);
  }

  /**
   * Returns a discount rate (0–1) for the given coupon code and items.
   * Called by CommerceService when building a quote.
   */
  resolveDiscount(items: { slug: string }[], couponCode?: string): number {
    if (!couponCode) return 0;
    const normalized = normalizeCode(couponCode);
    const coupon = this.coupons.get(normalized);
    if (!coupon || !coupon.isActive) return 0;

    if (coupon.conditions) {
      const hasMatch = items.some((item) => item.slug === coupon.conditions);
      if (!hasMatch) return 0;
    }

    if (coupon.discountType === "percentage") {
      return coupon.discountValue / 100;
    }

    // fixed discount — caller handles conversion from amount to rate
    return 0;
  }

  /**
   * Returns a fixed discount amount for coupons with discountType "fixed".
   * Returns 0 for percentage coupons (use resolveDiscount instead).
   */
  resolveFixedDiscount(items: { slug: string }[], couponCode?: string): number {
    if (!couponCode) return 0;
    const normalized = normalizeCode(couponCode);
    const coupon = this.coupons.get(normalized);
    if (!coupon || !coupon.isActive || coupon.discountType !== "fixed") return 0;

    if (coupon.conditions) {
      const hasMatch = items.some((item) => item.slug === coupon.conditions);
      if (!hasMatch) return 0;
    }

    return coupon.discountValue;
  }

  async recordUsage(couponCode: string) {
    const normalized = normalizeCode(couponCode);
    const coupon = this.coupons.get(normalized);
    if (!coupon) return;
    coupon.usageCount++;
    await this.persist();
  }
}
