import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  forwardRef
} from "@nestjs/common";
import {
  VendorCollaborationType,
  VendorApplicationStatus,
  VendorStatus,
  type AdminVendorCreateInput,
  type AdminVendorUpdateInput,
  type AuthUserSummary,
  type VendorApplicationIntent,
  type VendorApplicationActionInput,
  type VendorApplicationInput,
  type VendorApplicationSummary,
  type VendorCodeSummary,
  type VendorSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
import { CommissionsService } from "../commissions/commissions.service";
import { ModuleStateService } from "../../persistence/module-state.service";

interface VendorApplicationRecord extends VendorApplicationSummary {
  reviewedBy?: string;
  reviewedAt?: string;
  vendorCode?: string;
  vendorId?: string;
  statusHistory: Array<{
    status: VendorApplicationStatus;
    label: string;
    actor: string;
    occurredAt: string;
    note: string;
  }>;
}

interface VendorRecord extends VendorSummary {
  source?: string;
  applicationIds: string[];
  statusHistory: Array<{
    status: VendorStatus;
    actor: string;
    occurredAt: string;
    note: string;
  }>;
}

interface VendorFinancialSnapshot {
  sales: number;
  commissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  ordersCount: number;
}

interface VendorsSnapshot {
  applications: VendorApplicationRecord[];
  vendors: VendorRecord[];
}

const demoVendorApplicationIds = new Set(["va-001", "va-002"]);

const demoVendorIds = new Set(["ven-007", "ven-014", "ven-021"]);

const demoVendorCodes = new Set(["VEND-007", "VEND-014", "VEND-021"]);

const applicationStatusLabel: Record<VendorApplicationStatus, string> = {
  [VendorApplicationStatus.Submitted]: "Postulación recibida",
  [VendorApplicationStatus.Screening]: "En screening",
  [VendorApplicationStatus.Approved]: "Aprobada",
  [VendorApplicationStatus.Rejected]: "Rechazada",
  [VendorApplicationStatus.Onboarded]: "Onboarded"
};

const vendorStatusLabel: Record<VendorStatus, string> = {
  [VendorStatus.Active]: "Activo",
  [VendorStatus.Inactive]: "Inactivo",
  [VendorStatus.Suspended]: "Suspendido"
};

function nowIso() {
  return new Date().toISOString();
}

function demoDataEnabled() {
  const value = process.env.HUELEGOOD_ENABLE_DEMO_DATA?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || undefined;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeInternationalPhone(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return undefined;
  }

  const compact = normalized.replace(/\s+/g, "");
  return /^\+\d{8,15}$/.test(compact) ? normalized : undefined;
}

function parseApplicationIntent(value?: VendorApplicationIntent | string) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "affiliate" || normalized === "seller" || normalized === "content_creator" || normalized === "other") {
    return normalized as VendorApplicationIntent;
  }

  return undefined;
}

function normalizeApplicationIntent(value?: VendorApplicationIntent | string) {
  return parseApplicationIntent(value) ?? "seller";
}

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function normalizePreferredVendorCode(value?: string) {
  const normalized = value
    ?.trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || undefined;
}

function normalizeCollaborationType(value?: VendorCollaborationType | string) {
  return value === VendorCollaborationType.Affiliate ? VendorCollaborationType.Affiliate : VendorCollaborationType.Seller;
}

function normalizeOptionalCollaborationType(value?: VendorCollaborationType | string) {
  if (value === VendorCollaborationType.Affiliate) {
    return VendorCollaborationType.Affiliate;
  }

  if (value === VendorCollaborationType.Seller) {
    return VendorCollaborationType.Seller;
  }

  return undefined;
}

function normalizeVendorStatus(value?: VendorStatus | string) {
  if (value === VendorStatus.Inactive) {
    return VendorStatus.Inactive;
  }

  if (value === VendorStatus.Suspended) {
    return VendorStatus.Suspended;
  }

  return VendorStatus.Active;
}

function buildVendorCode(collaborationType: VendorCollaborationType, sequence: number) {
  const prefix = collaborationType === VendorCollaborationType.Affiliate ? "AFF" : "VEND";
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

function extractGeneratedVendorSequence(code?: string) {
  const match = normalizeCode(code)?.match(/^(?:VEND|AFF)-(\d{3,})$/);
  return match ? Number(match[1]) : undefined;
}

function suggestedCollaborationType(applicationIntent: VendorApplicationIntent) {
  return applicationIntent === "affiliate" ? VendorCollaborationType.Affiliate : VendorCollaborationType.Seller;
}

function fullName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function applicationHistory(status: VendorApplicationStatus, actor: string, note: string, occurredAt: string) {
  return {
    status,
    label: applicationStatusLabel[status],
    actor,
    occurredAt,
    note
  };
}

function vendorHistory(status: VendorStatus, actor: string, note: string, occurredAt: string) {
  return {
    status,
    label: vendorStatusLabel[status],
    actor,
    occurredAt,
    note
  };
}

function canRotateVendorCode(vendor: Pick<VendorRecord, "ordersCount" | "sales" | "commissions" | "pendingCommissions" | "paidCommissions">) {
  return (
    vendor.ordersCount === 0 &&
    vendor.sales === 0 &&
    vendor.commissions === 0 &&
    vendor.pendingCommissions === 0 &&
    vendor.paidCommissions === 0
  );
}

@Injectable()
export class VendorsService implements OnModuleInit {
  private readonly applications = new Map<string, VendorApplicationRecord>();

  private readonly vendors = new Map<string, VendorRecord>();

  private vendorSequence = 22;

  private vendorIdSequence = 1;

  constructor(
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => CommissionsService)) private readonly commissionsService: CommissionsService,
    private readonly moduleStateService: ModuleStateService
  ) {
    if (demoDataEnabled()) {
      this.seedApplications();
      this.seedVendors();
    }
    this.syncApplicationLinks();
    this.syncVendorIdSequence();
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<VendorsSnapshot>("vendors");
    if (snapshot) {
      const { snapshot: sanitizedSnapshot, changed } = demoDataEnabled()
        ? { snapshot, changed: false }
        : this.sanitizeSnapshot(snapshot);
      this.restoreSnapshot(sanitizedSnapshot);
      if (changed) {
        await this.persistState();
      }
    } else {
      await this.persistState();
    }
  }

  listApplications() {
    const applications = Array.from(this.applications.values()).sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt)
    );

    return wrapResponse<VendorApplicationSummary[]>(applications.map((application) => this.toApplicationSummary(application)), {
      total: applications.length,
      submitted: applications.filter((application) => application.status === VendorApplicationStatus.Submitted).length,
      screening: applications.filter((application) => application.status === VendorApplicationStatus.Screening).length,
      approved: applications.filter((application) => application.status === VendorApplicationStatus.Approved).length,
      rejected: applications.filter((application) => application.status === VendorApplicationStatus.Rejected).length
    });
  }

  submitApplication(body: VendorApplicationInput) {
    if (!body.name?.trim() || !body.email?.trim() || !body.city?.trim() || !body.phone?.trim()) {
      throw new BadRequestException("Nombre, email, ciudad y teléfono son obligatorios.");
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      throw new BadRequestException("Email inválido.");
    }

    const phone = normalizeText(body.phone);
    if (!phone) {
      throw new BadRequestException("Teléfono inválido.");
    }

    const applicationIntent = parseApplicationIntent(body.applicationIntent);
    if (!applicationIntent) {
      throw new BadRequestException("Debes indicar cómo quiere colaborar el postulante.");
    }

    if (this.findVendorByEmail(email)) {
      throw new ConflictException("Ya existe una postulación o vendedor con ese email.");
    }

    const blockingApplication = this.findBlockingApplicationByEmail(email);
    if (blockingApplication) {
      throw new ConflictException("Ya existe una postulación activa con ese email.");
    }

    const id = `va-${String(this.applications.size + 1).padStart(3, "0")}`;
    const createdAt = nowIso();
    const application: VendorApplicationRecord = {
      id,
      name: fullName(body.name),
      email,
      city: body.city.trim(),
      phone,
      applicationIntent,
      source: body.source?.trim() || "Formulario web",
      message: normalizeText(body.message),
      status: VendorApplicationStatus.Submitted,
      createdAt,
      updatedAt: createdAt,
      statusHistory: [applicationHistory(VendorApplicationStatus.Submitted, "Cliente", "Postulación recibida.", createdAt)]
    };

    this.applications.set(id, application);
    this.auditService.recordAudit({
      module: "vendors",
      action: "application.submitted",
      entityType: "vendor_application",
      entityId: id,
      summary: `Postulación recibida para ${application.name}.`,
      actorName: application.name,
      payload: {
        email: application.email,
        phone: application.phone,
        city: application.city,
        source: application.source,
        applicationIntent: application.applicationIntent
      }
    });
    void this.persistState();

    return {
      ...actionResponse("queued", "La postulación fue registrada para screening comercial.", id),
      application: this.toApplicationSummary(application)
    };
  }

  listVendors() {
    const vendors = Array.from(this.vendors.values()).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

    return wrapResponse<VendorSummary[]>(
      vendors.map((vendor) => this.toVendorSummary(vendor)),
      {
        total: vendors.length,
        active: vendors.filter((vendor) => vendor.status === VendorStatus.Active).length,
        inactive: vendors.filter((vendor) => vendor.status === VendorStatus.Inactive).length,
        suspended: vendors.filter((vendor) => vendor.status === VendorStatus.Suspended).length
      }
    );
  }

  listVendorCodes() {
    return wrapResponse<VendorCodeSummary[]>(
      Array.from(this.vendors.values())
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map((vendor) => ({
          code: vendor.code,
          name: vendor.name,
          collaborationType: vendor.collaborationType,
          status: vendor.status,
          approvedAt: vendor.approvedAt,
          updatedAt: vendor.updatedAt
        })),
      {
        total: this.vendors.size
      }
    );
  }

  screenApplication(id: string, body: VendorApplicationActionInput = {}) {
    const application = this.requireApplication(id);
    this.ensureApplicationStatus(application, [VendorApplicationStatus.Submitted], "iniciar screening");

    const now = nowIso();
    const reviewer = normalizeText(body.reviewer) || "admin";
    const notes = normalizeText(body.notes) || "Postulación enviada a screening comercial.";

    application.status = VendorApplicationStatus.Screening;
    application.updatedAt = now;
    application.statusHistory.push(applicationHistory(VendorApplicationStatus.Screening, reviewer, notes, now));
    this.auditService.recordAdminAction({
      actionType: "vendors.application.screening_started",
      targetType: "vendor_application",
      targetId: application.id,
      summary: `La postulación ${application.id} quedó en screening comercial.`,
      actorName: reviewer,
      metadata: {
        reviewer,
        notes,
        applicationIntent: application.applicationIntent
      }
    });
    void this.persistState();

    return {
      ...actionResponse("pending_review", "La postulación quedó en screening comercial.", id),
      application: this.toApplicationSummary(application)
    };
  }

  approveApplication(id: string, body: VendorApplicationActionInput = {}) {
    const application = this.requireApplication(id);
    this.ensureApplicationStatus(application, [VendorApplicationStatus.Screening], "aprobar");

    const now = nowIso();
    const reviewer = normalizeText(body.reviewer) || "admin";
    const notes = normalizeText(body.notes) || "Aprobado para onboarding comercial.";
    const resolvedCollaborationType = normalizeOptionalCollaborationType(body.resolvedCollaborationType);

    if (!resolvedCollaborationType) {
      throw new BadRequestException("Debes confirmar el tipo comercial final antes de aprobar la postulación.");
    }

    application.status = VendorApplicationStatus.Approved;
    application.reviewedBy = reviewer;
    application.reviewedAt = now;
    application.resolvedCollaborationType = resolvedCollaborationType;
    application.updatedAt = now;
    application.statusHistory.push(applicationHistory(VendorApplicationStatus.Approved, reviewer, notes, now));

    const vendor = this.upsertVendorFromApplication(
      application,
      reviewer,
      notes,
      now,
      resolvedCollaborationType,
      body.preferredCode
    );
    application.vendorCode = vendor.code;
    application.vendorId = vendor.id;
    this.auditService.recordAdminAction({
      actionType: "vendors.application.approved",
      targetType: "vendor_application",
      targetId: application.id,
      summary: `La postulación ${application.id} fue aprobada y generó el vendedor ${vendor.code}.`,
      actorName: reviewer,
      metadata: {
        vendorCode: vendor.code,
        reviewer,
        notes,
        applicationIntent: application.applicationIntent,
        resolvedCollaborationType
      }
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "La postulación fue aprobada y el vendedor quedó activo.", id),
      application: this.toApplicationSummary(application),
      vendor: this.toVendorSummary(vendor)
    };
  }

  rejectApplication(id: string, body: VendorApplicationActionInput = {}) {
    const application = this.requireApplication(id);
    this.ensureApplicationStatus(application, [VendorApplicationStatus.Screening], "rechazar");

    const now = nowIso();
    const reviewer = normalizeText(body.reviewer) || "admin";
    const notes = normalizeText(body.notes) || "No aprobado para onboarding comercial.";

    application.status = VendorApplicationStatus.Rejected;
    application.reviewedBy = reviewer;
    application.reviewedAt = now;
    application.updatedAt = now;
    application.statusHistory.push(applicationHistory(VendorApplicationStatus.Rejected, reviewer, notes, now));
    this.auditService.recordAdminAction({
      actionType: "vendors.application.rejected",
      targetType: "vendor_application",
      targetId: application.id,
      summary: `La postulación ${application.id} fue rechazada.`,
      actorName: reviewer,
      metadata: {
        reviewer,
        notes,
        applicationIntent: application.applicationIntent
      }
    });
    void this.persistState();

    return {
      ...actionResponse("rejected", "La postulación fue rechazada y quedó registrada.", id),
      application: this.toApplicationSummary(application)
    };
  }

  createManualVendor(body: AdminVendorCreateInput) {
    if (!body.name?.trim() || !body.email?.trim() || !body.city?.trim() || !body.phone?.trim()) {
      throw new BadRequestException("Nombre, email, ciudad y WhatsApp son obligatorios.");
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      throw new BadRequestException("Email inválido.");
    }

    const phone = normalizeInternationalPhone(body.phone);
    if (!phone) {
      throw new BadRequestException("WhatsApp inválido. Usa formato internacional con código de país, por ejemplo +51 998906481.");
    }

    const preferredCode = this.resolvePreferredVendorCode(body.preferredCode);

    if (this.findVendorByEmail(email)) {
      throw new ConflictException("Ya existe una postulación o vendedor con ese email.");
    }

    const blockingApplication = this.findBlockingApplicationByEmail(email);
    if (blockingApplication) {
      throw new ConflictException("Ya existe una postulación activa con ese email. Revísala o apruébala antes de crear otro vendedor.");
    }

    const occurredAt = nowIso();
    const actor = "admin";
    const note = normalizeText(body.notes) || "Alta manual desde backoffice.";
    const collaborationType = normalizeCollaborationType(body.collaborationType);
    const id = this.reserveVendorId();
    const code = preferredCode ?? this.reserveGeneratedVendorCode(collaborationType);

    const vendor: VendorRecord = {
      id,
      name: fullName(body.name),
      email,
      phone,
      code,
      collaborationType,
      city: body.city.trim(),
      source: normalizeText(body.source) || "Alta manual admin",
      status: VendorStatus.Active,
      sales: 0,
      commissions: 0,
      pendingCommissions: 0,
      paidCommissions: 0,
      ordersCount: 0,
      applicationsCount: 0,
      approvedAt: occurredAt,
      updatedAt: occurredAt,
      applicationIds: [],
      statusHistory: [vendorHistory(VendorStatus.Active, actor, note, occurredAt)]
    };

    this.vendors.set(vendor.code, vendor);
    this.auditService.recordAdminAction({
      actionType: "vendors.manual.created",
      targetType: "vendor",
      targetId: vendor.id,
      summary: `Se dio de alta manual al ${collaborationType === VendorCollaborationType.Affiliate ? "afiliado" : "vendedor"} ${vendor.code}.`,
      actorName: actor,
      metadata: {
        code: vendor.code,
        email: vendor.email,
        phone,
        preferredCode: preferredCode ?? null,
        collaborationType: vendor.collaborationType
      }
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El perfil comercial quedó creado.", vendor.id),
      vendor: this.toVendorSummary(vendor)
    };
  }

  updateVendor(id: string, body: AdminVendorUpdateInput) {
    const vendor = this.requireVendor(id);

    if (!body.name?.trim() || !body.email?.trim() || !body.city?.trim() || !body.phone?.trim()) {
      throw new BadRequestException("Nombre, email, ciudad y WhatsApp son obligatorios.");
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      throw new BadRequestException("Email inválido.");
    }

    const phone = normalizeInternationalPhone(body.phone);
    if (!phone) {
      throw new BadRequestException("WhatsApp inválido. Usa formato internacional con código de país, por ejemplo +51 998906481.");
    }

    const existingVendorByEmail = this.findVendorByEmail(email);
    if (existingVendorByEmail && existingVendorByEmail.id !== vendor.id) {
      throw new ConflictException("Ya existe una postulación o vendedor con ese email.");
    }

    const blockingApplication = this.findBlockingApplicationByEmail(email);
    if (blockingApplication && !vendor.applicationIds.includes(blockingApplication.id) && email !== normalizeEmail(vendor.email)) {
      throw new ConflictException("Ya existe una postulación activa con ese email.");
    }

    const now = nowIso();
    const actor = "admin";
    const note = normalizeText(body.notes) || "Perfil comercial actualizado desde backoffice.";
    const nextStatus = normalizeVendorStatus(body.status);
    const nextCode = this.resolveVendorCodeForUpdate(body.preferredCode, vendor);
    const codeChanged = nextCode !== vendor.code;

    if (codeChanged && !canRotateVendorCode(vendor)) {
      throw new BadRequestException(
        "Solo puedes cambiar el código de vendedores sin pedidos, ventas ni comisiones históricas."
      );
    }

    const previousCode = vendor.code;

    vendor.name = fullName(body.name);
    vendor.email = email;
    vendor.phone = phone;
    vendor.city = body.city.trim();
    vendor.source = normalizeText(body.source) || vendor.source || "Alta manual admin";
    vendor.collaborationType = normalizeCollaborationType(body.collaborationType);
    vendor.status = nextStatus;
    vendor.updatedAt = now;
    vendor.statusHistory.push(vendorHistory(nextStatus, actor, note, now));

    if (codeChanged) {
      this.vendors.delete(previousCode);
      vendor.code = nextCode;
      this.syncVendorCodeInApplications(vendor.id, previousCode, nextCode, now);
      this.commissionsService.replaceVendorCodeReferences(previousCode, nextCode, actor);
      this.vendors.set(vendor.code, vendor);
    }

    this.auditService.recordAdminAction({
      actionType: "vendors.updated",
      targetType: "vendor",
      targetId: vendor.id,
      summary: `Se actualizó el vendedor ${vendor.code}.`,
      actorName: actor,
      metadata: {
        code: vendor.code,
        previousCode: codeChanged ? previousCode : null,
        email: vendor.email,
        phone: vendor.phone,
        city: vendor.city,
        source: vendor.source,
        collaborationType: vendor.collaborationType,
        status: vendor.status
      }
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El vendedor fue actualizado.", vendor.id),
      vendor: this.toVendorSummary(vendor)
    };
  }

  deleteVendor(id: string) {
    const vendor = this.requireVendor(id);

    if (
      vendor.ordersCount > 0 ||
      vendor.sales > 0 ||
      vendor.commissions > 0 ||
      vendor.pendingCommissions > 0 ||
      vendor.paidCommissions > 0 ||
      vendor.applicationIds.length > 0 ||
      vendor.applicationsCount > 0
    ) {
      throw new BadRequestException(
        "Solo puedes eliminar vendedores sin ventas, comisiones ni postulaciones vinculadas."
      );
    }

    this.vendors.delete(vendor.code);
    this.auditService.recordAdminAction({
      actionType: "vendors.deleted",
      targetType: "vendor",
      targetId: vendor.id,
      summary: `Se eliminó el vendedor ${vendor.code}.`,
      actorName: "admin",
      metadata: {
        code: vendor.code,
        email: vendor.email
      }
    });
    void this.persistState();

    return actionResponse("ok", "El vendedor fue eliminado.", vendor.id);
  }

  findVendorByCode(code?: string) {
    if (!code) {
      return null;
    }

    return this.vendors.get(normalizeCode(code) || "") ?? null;
  }

  findVendorSummaryByCode(code?: string) {
    const vendor = this.findVendorByCode(code);
    return vendor ? this.toVendorSummary(vendor) : null;
  }

  findVendorSummaryByEmail(email?: string) {
    const vendor = this.findVendorByEmail(email ? normalizeEmail(email) : undefined);
    return vendor ? this.toVendorSummary(vendor) : null;
  }

  resolveVendorSummaryForAuthUser(user: Pick<AuthUserSummary, "email" | "vendorCode">) {
    return this.findVendorSummaryByCode(user.vendorCode) ?? this.findVendorSummaryByEmail(user.email);
  }

  applyFinancialSnapshot(code: string, snapshot: VendorFinancialSnapshot) {
    const vendor = this.findVendorByCode(code);
    if (!vendor) {
      return null;
    }

    vendor.sales = snapshot.sales;
    vendor.commissions = snapshot.commissions;
    vendor.pendingCommissions = snapshot.pendingCommissions;
    vendor.paidCommissions = snapshot.paidCommissions;
    vendor.ordersCount = snapshot.ordersCount;
    vendor.updatedAt = nowIso();
    void this.persistState();

    return this.toVendorSummary(vendor);
  }

  private upsertVendorFromApplication(
    application: VendorApplicationRecord,
    actor: string,
    note: string,
    occurredAt: string,
    collaborationType: VendorCollaborationType,
    preferredCodeInput?: string
  ) {
    const preferredCode = this.resolvePreferredVendorCode(preferredCodeInput);
    const existing = this.findVendorByEmail(application.email) ?? this.findVendorByName(application.name);

    if (existing) {
      if (preferredCode && normalizeCode(existing.code) !== preferredCode) {
        throw new ConflictException(
          `La postulación ya está vinculada al vendedor ${existing.code}. No se puede reemplazar por ${preferredCode}.`
        );
      }

      existing.collaborationType = collaborationType;
      existing.status = VendorStatus.Active;
      existing.city = application.city;
      existing.email = application.email;
      existing.phone = application.phone;
      existing.source = application.source;
      existing.updatedAt = occurredAt;
      existing.approvedAt = existing.approvedAt ?? occurredAt;
      existing.applicationIds = Array.from(new Set([...existing.applicationIds, application.id]));
      existing.statusHistory.push(vendorHistory(VendorStatus.Active, actor, note, occurredAt));
      return existing;
    }

    const id = this.reserveVendorId();
    const code = preferredCode ?? this.reserveGeneratedVendorCode(collaborationType);

    const vendor: VendorRecord = {
      id,
      name: application.name,
      email: application.email,
      phone: application.phone,
      code,
      collaborationType,
      city: application.city,
      source: application.source,
      status: VendorStatus.Active,
      sales: 0,
      commissions: 0,
      pendingCommissions: 0,
      paidCommissions: 0,
      ordersCount: 0,
      applicationsCount: 1,
      approvedAt: occurredAt,
      updatedAt: occurredAt,
      applicationIds: [application.id],
      statusHistory: [vendorHistory(VendorStatus.Active, actor, note, occurredAt)]
    };

    this.vendors.set(vendor.code, vendor);
    return vendor;
  }

  private resolvePreferredVendorCode(value?: string) {
    const preferredCode = normalizePreferredVendorCode(value);
    if (!preferredCode) {
      return undefined;
    }

    if (preferredCode.length < 3 || preferredCode.length > 24) {
      throw new BadRequestException("El código comercial debe tener entre 3 y 24 caracteres.");
    }

    if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(preferredCode)) {
      throw new BadRequestException("El código comercial solo puede usar letras, números y guiones intermedios.");
    }

    if (this.vendors.has(preferredCode)) {
      throw new ConflictException(`Ya existe un vendedor con el código ${preferredCode}.`);
    }

    return preferredCode;
  }

  private resolveVendorCodeForUpdate(value: string | undefined, vendor: VendorRecord) {
    const preferredCode = normalizePreferredVendorCode(value) ?? vendor.code;

    if (preferredCode.length < 3 || preferredCode.length > 24) {
      throw new BadRequestException("El código comercial debe tener entre 3 y 24 caracteres.");
    }

    if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(preferredCode)) {
      throw new BadRequestException("El código comercial solo puede usar letras, números y guiones intermedios.");
    }

    const existing = this.vendors.get(preferredCode);
    if (existing && existing.id !== vendor.id) {
      throw new ConflictException(`Ya existe un vendedor con el código ${preferredCode}.`);
    }

    return preferredCode;
  }

  private syncVendorCodeInApplications(vendorId: string, previousCode: string, nextCode: string, occurredAt: string) {
    for (const application of this.applications.values()) {
      if (application.vendorId !== vendorId && normalizeCode(application.vendorCode) !== previousCode) {
        continue;
      }

      application.vendorId = vendorId;
      application.vendorCode = nextCode;
      application.updatedAt = occurredAt;
    }
  }

  private reserveGeneratedVendorCode(collaborationType: VendorCollaborationType) {
    while (true) {
      const code = buildVendorCode(collaborationType, this.vendorSequence);
      this.vendorSequence += 1;

      if (!this.vendors.has(code)) {
        return code;
      }
    }
  }

  private reserveVendorId() {
    const id = `ven-${String(this.vendorIdSequence).padStart(3, "0")}`;
    this.vendorIdSequence += 1;
    return id;
  }

  private requireApplication(id: string) {
    const application = this.applications.get(id.trim());
    if (!application) {
      throw new NotFoundException(`No encontramos una postulación con id ${id}.`);
    }

    return application;
  }

  private requireVendor(id: string) {
    const vendor = this.findVendorById(id);
    if (!vendor) {
      throw new NotFoundException(`No encontramos un vendedor con id ${id}.`);
    }

    return vendor;
  }

  private ensureApplicationStatus(
    application: VendorApplicationRecord,
    allowedStatuses: VendorApplicationStatus[],
    actionLabel: string
  ) {
    if (allowedStatuses.includes(application.status)) {
      return;
    }

    throw new BadRequestException(`No se puede ${actionLabel} una postulación en estado ${application.status}.`);
  }

  private findApplicationByEmail(email?: string) {
    if (!email) {
      return null;
    }

    return Array.from(this.applications.values()).find((application) => application.email === email) ?? null;
  }

  private findBlockingApplicationByEmail(email?: string) {
    if (!email) {
      return null;
    }

    return (
      Array.from(this.applications.values()).find(
        (application) => application.email === email && application.status !== VendorApplicationStatus.Rejected
      ) ?? null
    );
  }

  private findVendorByEmail(email?: string) {
    if (!email) {
      return null;
    }

    return Array.from(this.vendors.values()).find((vendor) => vendor.email === email) ?? null;
  }

  private findVendorById(id?: string) {
    if (!id) {
      return null;
    }

    return Array.from(this.vendors.values()).find((vendor) => vendor.id === id.trim()) ?? null;
  }

  private findVendorByName(name?: string) {
    if (!name) {
      return null;
    }

    const normalized = fullName(name).toLowerCase();
    return Array.from(this.vendors.values()).find((vendor) => vendor.name.toLowerCase() === normalized) ?? null;
  }

  private syncApplicationLinks() {
    for (const application of this.applications.values()) {
      const vendor = this.findVendorByEmail(application.email) ?? this.findVendorByName(application.name);
      if (vendor) {
        application.vendorCode = vendor.code;
        application.vendorId = vendor.id;
        application.resolvedCollaborationType = application.resolvedCollaborationType ?? vendor.collaborationType;
      }
    }
  }

  private sanitizeSnapshot(snapshot: VendorsSnapshot) {
    let changed = false;

    const applications: VendorApplicationRecord[] = [];
    for (const application of snapshot.applications ?? []) {
      if (demoVendorApplicationIds.has(application.id)) {
        changed = true;
        continue;
      }

      applications.push({
        ...application,
        phone: normalizeText(application.phone),
        applicationIntent: normalizeApplicationIntent(application.applicationIntent),
        resolvedCollaborationType:
          normalizeOptionalCollaborationType(application.resolvedCollaborationType) ??
          (application.status === VendorApplicationStatus.Approved
            ? suggestedCollaborationType(normalizeApplicationIntent(application.applicationIntent))
            : undefined),
        statusHistory: (application.statusHistory ?? []).map((entry) => ({ ...entry }))
      });
    }

    const allowedApplicationIds = new Set(applications.map((application) => application.id));
    const vendors: VendorRecord[] = [];

    for (const vendor of snapshot.vendors ?? []) {
      if (demoVendorIds.has(vendor.id) || demoVendorCodes.has(vendor.code)) {
        changed = true;
        continue;
      }

      const applicationIds = vendor.applicationIds.filter((applicationId) => allowedApplicationIds.has(applicationId));
      if (applicationIds.length !== vendor.applicationIds.length) {
        changed = true;
      }

      const applicationsCount = applicationIds.length;
      if (applicationsCount !== vendor.applicationsCount) {
        changed = true;
      }

      vendors.push({
        ...vendor,
        collaborationType: normalizeCollaborationType(vendor.collaborationType),
        phone: normalizeInternationalPhone(vendor.phone) ?? normalizeText(vendor.phone),
        source: normalizeText(vendor.source),
        applicationIds,
        applicationsCount,
        statusHistory: (vendor.statusHistory ?? []).map((entry) => ({ ...entry }))
      });
    }

    return {
      snapshot: {
        applications,
        vendors
      },
      changed
    };
  }

  private seedApplications() {
    const seeds: Array<Partial<VendorApplicationRecord> & Pick<VendorApplicationRecord, "id" | "name" | "email" | "city" | "source" | "status">> = [
      {
        id: "va-001",
        name: "Mónica Herrera",
        email: "monica@seller.com",
        city: "Lima",
        source: "Formulario web",
        status: VendorApplicationStatus.Screening
      },
      {
        id: "va-002",
        name: "Jorge Salas",
        email: "jorge@seller.com",
        city: "Arequipa",
        source: "Campaña",
        status: VendorApplicationStatus.Approved
      }
    ];

    const createdAt = "2026-03-18T09:00:00.000Z";
    for (const seed of seeds) {
      this.applications.set(seed.id, {
        ...seed,
        phone: seed.id === "va-001" ? "+51 999 111 222" : "+51 999 333 444",
        applicationIntent: "seller",
        message: undefined,
        reviewedBy: seed.status === VendorApplicationStatus.Approved ? "admin" : undefined,
        reviewedAt: seed.status === VendorApplicationStatus.Approved ? "2026-03-18T09:15:00.000Z" : undefined,
        vendorCode: undefined,
        vendorId: undefined,
        resolvedCollaborationType:
          seed.status === VendorApplicationStatus.Approved ? VendorCollaborationType.Seller : undefined,
        createdAt,
        updatedAt: createdAt,
        statusHistory:
          seed.status === VendorApplicationStatus.Approved
            ? [
                applicationHistory(VendorApplicationStatus.Submitted, "Cliente", "Postulación recibida.", createdAt),
                applicationHistory(VendorApplicationStatus.Screening, "seller_manager", "Postulación en screening.", "2026-03-18T09:10:00.000Z"),
                applicationHistory(VendorApplicationStatus.Approved, "admin", "Aprobada en onboarding.", "2026-03-18T09:15:00.000Z")
              ]
            : [
                applicationHistory(VendorApplicationStatus.Submitted, "Cliente", "Postulación recibida.", createdAt),
                applicationHistory(VendorApplicationStatus.Screening, "seller_manager", "Postulación en screening.", "2026-03-18T09:10:00.000Z")
              ]
      });
    }
  }

  private seedVendors() {
    const seeds = [
      {
        id: "ven-014",
        name: "Mónica Herrera",
        email: "monica@seller.com",
        code: "VEND-014",
        collaborationType: VendorCollaborationType.Seller,
        city: "Lima",
        status: VendorStatus.Active,
        sales: 12600,
        commissions: 1890,
        pendingCommissions: 0,
        paidCommissions: 1890,
        ordersCount: 34,
        applicationsCount: 1,
        approvedAt: "2026-03-01T09:00:00.000Z",
        updatedAt: "2026-03-18T09:30:00.000Z"
      },
      {
        id: "ven-007",
        name: "Jorge Salas",
        email: "jorge@seller.com",
        code: "VEND-007",
        collaborationType: VendorCollaborationType.Seller,
        city: "Arequipa",
        status: VendorStatus.Active,
        sales: 9800,
        commissions: 1470,
        pendingCommissions: 0,
        paidCommissions: 1470,
        ordersCount: 28,
        applicationsCount: 1,
        approvedAt: "2026-03-04T11:00:00.000Z",
        updatedAt: "2026-03-18T09:30:00.000Z"
      },
      {
        id: "ven-021",
        name: "Ana Torres",
        email: "ana@seller.com",
        code: "VEND-021",
        collaborationType: VendorCollaborationType.Seller,
        city: "Cusco",
        status: VendorStatus.Active,
        sales: 16800,
        commissions: 2520,
        pendingCommissions: 0,
        paidCommissions: 2520,
        ordersCount: 41,
        applicationsCount: 0,
        approvedAt: "2026-02-26T14:00:00.000Z",
        updatedAt: "2026-03-18T09:30:00.000Z"
      }
    ];

    for (const seed of seeds) {
      const applicationIds =
        seed.code === "VEND-014" ? ["va-001"] : seed.code === "VEND-007" ? ["va-002"] : [];
      this.vendors.set(seed.code, {
        ...seed,
        phone: seed.code === "VEND-021" ? "+51 999 555 666" : seed.code === "VEND-007" ? "+51 999 333 444" : "+51 999 111 222",
        source: seed.code === "VEND-021" ? "Referencia comercial" : "Formulario web",
        applicationIds,
        statusHistory: [vendorHistory(VendorStatus.Active, "admin", "Vendedor activo.", seed.approvedAt ?? seed.updatedAt)]
      });
      const numericCode = extractGeneratedVendorSequence(seed.code);
      if (typeof numericCode === "number") {
        this.vendorSequence = Math.max(this.vendorSequence, numericCode + 1);
      }
    }
  }

  private restoreSnapshot(snapshot: VendorsSnapshot) {
    this.applications.clear();
    this.vendors.clear();

    for (const application of snapshot.applications ?? []) {
      this.applications.set(application.id, {
        ...application,
        phone: normalizeText(application.phone),
        applicationIntent: normalizeApplicationIntent(application.applicationIntent),
        resolvedCollaborationType: normalizeOptionalCollaborationType(application.resolvedCollaborationType),
        statusHistory: (application.statusHistory ?? []).map((entry) => ({ ...entry }))
      });
    }

    for (const vendor of snapshot.vendors ?? []) {
      this.vendors.set(vendor.code, {
        ...vendor,
        collaborationType: normalizeCollaborationType(vendor.collaborationType),
        phone: normalizeInternationalPhone(vendor.phone) ?? normalizeText(vendor.phone),
        source: normalizeText(vendor.source)
      });
    }

    this.syncApplicationLinks();
    this.syncVendorSequence();
    this.syncVendorIdSequence();
  }

  private syncVendorSequence() {
    const sequence = Array.from(this.vendors.values()).reduce((max, vendor) => {
      const numeric = extractGeneratedVendorSequence(vendor.code);
      return typeof numeric === "number" ? Math.max(max, numeric) : max;
    }, 0);

    this.vendorSequence = Math.max(sequence + 1, 1);
  }

  private syncVendorIdSequence() {
    const sequence = Array.from(this.vendors.values()).reduce((max, vendor) => {
      const match = vendor.id.match(/^ven-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    this.vendorIdSequence = Math.max(sequence + 1, 1);
  }

  private async persistState() {
    await this.moduleStateService.save<VendorsSnapshot>("vendors", this.buildSnapshot());
  }

  private buildSnapshot(): VendorsSnapshot {
    return {
      applications: Array.from(this.applications.values()).map((application) => ({
        ...application,
        statusHistory: application.statusHistory.map((entry) => ({ ...entry }))
      })),
      vendors: Array.from(this.vendors.values()).map((vendor) => ({
        ...vendor,
        applicationIds: [...vendor.applicationIds],
        statusHistory: vendor.statusHistory.map((entry) => ({ ...entry }))
      }))
    };
  }

  private toApplicationSummary(application: VendorApplicationRecord): VendorApplicationSummary {
    return {
      id: application.id,
      name: application.name,
      email: application.email,
      city: application.city,
      phone: application.phone,
      applicationIntent: application.applicationIntent,
      source: application.source,
      status: application.status,
      message: application.message,
      reviewedBy: application.reviewedBy,
      reviewedAt: application.reviewedAt,
      vendorCode: application.vendorCode,
      resolvedCollaborationType: application.resolvedCollaborationType,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt
    };
  }

  private toVendorSummary(vendor: VendorRecord | null): VendorSummary {
    if (!vendor) {
      throw new NotFoundException("No encontramos el vendedor solicitado.");
    }

    return {
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone,
      code: vendor.code,
      collaborationType: vendor.collaborationType ?? VendorCollaborationType.Seller,
      city: vendor.city,
      source: vendor.source,
      status: vendor.status,
      sales: vendor.sales,
      commissions: vendor.commissions,
      pendingCommissions: vendor.pendingCommissions,
      paidCommissions: vendor.paidCommissions,
      ordersCount: vendor.ordersCount,
      applicationsCount: vendor.applicationIds.length || vendor.applicationsCount,
      approvedAt: vendor.approvedAt,
      updatedAt: vendor.updatedAt
    };
  }
}
