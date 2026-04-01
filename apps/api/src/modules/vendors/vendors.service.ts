import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit
} from "@nestjs/common";
import {
  VendorCollaborationType,
  VendorApplicationStatus,
  VendorStatus,
  type AdminVendorCreateInput,
  type AuthUserSummary,
  type VendorApplicationActionInput,
  type VendorApplicationInput,
  type VendorApplicationSummary,
  type VendorCodeSummary,
  type VendorSummary
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
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

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function normalizeCollaborationType(value?: VendorCollaborationType | string) {
  return value === VendorCollaborationType.Affiliate ? VendorCollaborationType.Affiliate : VendorCollaborationType.Seller;
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

@Injectable()
export class VendorsService implements OnModuleInit {
  private readonly applications = new Map<string, VendorApplicationRecord>();

  private readonly vendors = new Map<string, VendorRecord>();

  private vendorSequence = 22;

  constructor(
    private readonly auditService: AuditService,
    private readonly moduleStateService: ModuleStateService
  ) {
    if (demoDataEnabled()) {
      this.seedApplications();
      this.seedVendors();
    }
    this.syncApplicationLinks();
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
    if (!body.name?.trim() || !body.email?.trim() || !body.city?.trim()) {
      throw new BadRequestException("Nombre, email y ciudad son obligatorios.");
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      throw new BadRequestException("Email inválido.");
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
      source: body.source?.trim() || "Formulario web",
      message: normalizeText(body.message),
      phone: normalizeText(body.phone),
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
        city: application.city,
        source: application.source
      }
    });
    void this.persistState();

    return {
      ...actionResponse("queued", "La postulación fue registrada y quedará en screening.", id),
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
      Array.from(this.vendors.values()).map((vendor) => ({
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

  approveApplication(id: string, body: VendorApplicationActionInput = {}) {
    const application = this.requireApplication(id);
    const now = nowIso();
    const reviewer = normalizeText(body.reviewer) || "admin";
    const notes = normalizeText(body.notes) || "Aprobado para onboarding comercial.";

    application.status = VendorApplicationStatus.Approved;
    application.reviewedBy = reviewer;
    application.reviewedAt = now;
    application.updatedAt = now;
    application.statusHistory.push(applicationHistory(VendorApplicationStatus.Approved, reviewer, notes, now));

    const vendor = this.upsertVendorFromApplication(application, reviewer, notes, now);
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
        notes
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
        notes
      }
    });
    void this.persistState();

    return {
      ...actionResponse("rejected", "La postulación fue rechazada y quedó registrada.", id),
      application: this.toApplicationSummary(application)
    };
  }

  createManualVendor(body: AdminVendorCreateInput) {
    if (!body.name?.trim() || !body.email?.trim() || !body.city?.trim()) {
      throw new BadRequestException("Nombre, email y ciudad son obligatorios.");
    }

    const email = normalizeEmail(body.email);
    if (!email) {
      throw new BadRequestException("Email inválido.");
    }

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
    const id = `ven-${String(this.vendors.size + 1).padStart(3, "0")}`;
    const codePrefix = collaborationType === VendorCollaborationType.Affiliate ? "AFF" : "VEND";
    const code = `${codePrefix}-${String(this.vendorSequence).padStart(3, "0")}`;
    this.vendorSequence += 1;

    const vendor: VendorRecord = {
      id,
      name: fullName(body.name),
      email,
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
        collaborationType: vendor.collaborationType
      }
    });
    void this.persistState();

    return {
      ...actionResponse("ok", "El perfil comercial quedó creado.", vendor.id),
      vendor: this.toVendorSummary(vendor)
    };
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

  private upsertVendorFromApplication(application: VendorApplicationRecord, actor: string, note: string, occurredAt: string) {
    const existing = this.findVendorByEmail(application.email) ?? this.findVendorByName(application.name);

    if (existing) {
      existing.collaborationType = existing.collaborationType ?? VendorCollaborationType.Seller;
      existing.status = VendorStatus.Active;
      existing.city = application.city;
      existing.email = application.email;
      existing.source = application.source;
      existing.updatedAt = occurredAt;
      existing.approvedAt = existing.approvedAt ?? occurredAt;
      existing.applicationIds = Array.from(new Set([...existing.applicationIds, application.id]));
      existing.statusHistory.push(vendorHistory(VendorStatus.Active, actor, note, occurredAt));
      return existing;
    }

    const id = `ven-${String(this.vendors.size + 1).padStart(3, "0")}`;
    const code = `VEND-${String(this.vendorSequence).padStart(3, "0")}`;
    this.vendorSequence += 1;

    const vendor: VendorRecord = {
      id,
      name: application.name,
      email: application.email,
      code,
      collaborationType: VendorCollaborationType.Seller,
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

  private requireApplication(id: string) {
    const application = this.applications.get(id.trim());
    if (!application) {
      throw new NotFoundException(`No encontramos una postulación con id ${id}.`);
    }

    return application;
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
        statusHistory: application.statusHistory.map((entry) => ({ ...entry }))
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
        applicationIds,
        applicationsCount,
        statusHistory: vendor.statusHistory.map((entry) => ({ ...entry }))
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
        message: undefined,
        reviewedBy: seed.status === VendorApplicationStatus.Approved ? "admin" : undefined,
        reviewedAt: seed.status === VendorApplicationStatus.Approved ? "2026-03-18T09:15:00.000Z" : undefined,
        vendorCode: undefined,
        vendorId: undefined,
        createdAt,
        updatedAt: createdAt,
        statusHistory:
          seed.status === VendorApplicationStatus.Approved
            ? [
                applicationHistory(VendorApplicationStatus.Submitted, "Cliente", "Postulación recibida.", createdAt),
                applicationHistory(VendorApplicationStatus.Approved, "admin", "Aprobada en onboarding.", "2026-03-18T09:15:00.000Z")
              ]
            : [applicationHistory(VendorApplicationStatus.Submitted, "Cliente", "Postulación recibida.", createdAt)]
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
        source: seed.code === "VEND-021" ? "Referencia comercial" : "Formulario web",
        applicationIds,
        statusHistory: [vendorHistory(VendorStatus.Active, "admin", "Vendedor activo.", seed.approvedAt ?? seed.updatedAt)]
      });
      const numericCode = Number(seed.code.replace(/[^\d]/g, ""));
      if (Number.isFinite(numericCode)) {
        this.vendorSequence = Math.max(this.vendorSequence, numericCode + 1);
      }
    }
  }

  private restoreSnapshot(snapshot: VendorsSnapshot) {
    this.applications.clear();
    this.vendors.clear();

    for (const application of snapshot.applications ?? []) {
      this.applications.set(application.id, application);
    }

    for (const vendor of snapshot.vendors ?? []) {
      this.vendors.set(vendor.code, {
        ...vendor,
        collaborationType: normalizeCollaborationType(vendor.collaborationType)
      });
    }

    this.syncApplicationLinks();
    this.syncVendorSequence();
  }

  private syncVendorSequence() {
    const sequence = Array.from(this.vendors.values()).reduce((max, vendor) => {
      const numeric = Number(vendor.code.replace(/[^\d]/g, ""));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);

    this.vendorSequence = Math.max(sequence + 1, 1);
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
      source: application.source,
      status: application.status,
      phone: application.phone,
      message: application.message,
      reviewedBy: application.reviewedBy,
      reviewedAt: application.reviewedAt,
      vendorCode: application.vendorCode,
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
      code: vendor.code,
      collaborationType: vendor.collaborationType ?? VendorCollaborationType.Seller,
      city: vendor.city,
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
