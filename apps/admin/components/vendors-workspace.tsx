"use client"

import { useEffect, useMemo, useState, type ButtonHTMLAttributes, type ReactNode, type SVGProps } from "react"
import { PhoneInput } from "react-international-phone"
import {
  AdminDataTable,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SectionHeader,
  Separator,
  StatusBadge,
  Textarea
} from "@huelegood/ui"
import {
  VendorCollaborationType,
  type VendorApplicationIntent,
  type VendorApplicationSummary,
  type VendorCodeSummary,
  VendorStatus,
  type VendorSummary
} from "@huelegood/shared"
import {
  approveVendorApplication,
  createCommissionRule,
  createVendor,
  deleteVendor,
  fetchVendorApplications,
  fetchVendorCodes,
  fetchVendors,
  rejectVendorApplication,
  screenVendorApplication,
  updateVendor
} from "../lib/api"

type ReviewFilter = "pending" | "resolved" | "all"

const DEFAULT_MANUAL_VENDOR_COUNTRY_CODE = "+51"
const PREFERRED_PHONE_COUNTRIES = ["pe", "co", "cl", "ec", "ar", "mx", "us"] as const

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0
  }).format(value)
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin dato"
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

function applicationTone(status: VendorApplicationSummary["status"]): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "approved" || status === "onboarded") {
    return "success"
  }

  if (status === "rejected") {
    return "danger"
  }

  if (status === "screening") {
    return "warning"
  }

  return "info"
}

function vendorTone(status: VendorStatus): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") {
    return "success"
  }

  if (status === "suspended") {
    return "danger"
  }

  return "warning"
}

function applicationStatusLabel(status: VendorApplicationSummary["status"]) {
  if (status === "submitted") {
    return "Por revisar"
  }

  if (status === "screening") {
    return "En evaluación"
  }

  if (status === "approved") {
    return "Aprobada"
  }

  if (status === "rejected") {
    return "Rechazada"
  }

  return "Lista para operar"
}

function vendorStatusLabel(status: VendorStatus) {
  if (status === "active") {
    return "Activo"
  }

  if (status === "suspended") {
    return "Suspendido"
  }

  return "Inactivo"
}

function collaborationTypeLabel(type?: VendorCollaborationType) {
  return type === VendorCollaborationType.Affiliate ? "Afiliado" : "Vendedor"
}

function applicationIntentLabel(intent: VendorApplicationIntent) {
  if (intent === "affiliate") {
    return "Quiere afiliarse"
  }

  if (intent === "content_creator") {
    return "Quiere crear contenido"
  }

  if (intent === "other") {
    return "Otra colaboración"
  }

  return "Quiere vender"
}

function defaultApprovalType(application: Pick<VendorApplicationSummary, "applicationIntent">) {
  return application.applicationIntent === "affiliate" ? VendorCollaborationType.Affiliate : VendorCollaborationType.Seller
}

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function isResolvedApplication(status: VendorApplicationSummary["status"]) {
  return status === "approved" || status === "rejected" || status === "onboarded"
}

function normalizeCountryCodeInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  return digits ? `+${digits}` : "+"
}

function normalizePhoneNumberInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 14)
}

function normalizeFriendlyVendorCodeInput(value: string) {
  return value
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
}

function validateInternationalWhatsApp(countryCode: string, phoneNumber: string) {
  const normalizedCountryCode = countryCode.trim()
  const normalizedPhoneNumber = normalizePhoneNumberInput(phoneNumber)

  if (!normalizedCountryCode || normalizedCountryCode === "+") {
    return "Ingresa el código de país."
  }

  if (!/^\+\d{1,4}$/.test(normalizedCountryCode)) {
    return "El código país debe empezar con + y contener hasta 4 dígitos."
  }

  if (!normalizedPhoneNumber) {
    return "Ingresa el número de WhatsApp."
  }

  if (!/^\d{7,14}$/.test(normalizedPhoneNumber)) {
    return "El número de WhatsApp debe tener entre 7 y 14 dígitos."
  }

  return null
}

function buildInternationalWhatsApp(countryCode: string, phoneNumber: string) {
  if (validateInternationalWhatsApp(countryCode, phoneNumber)) {
    return null
  }

  return `${countryCode.trim()} ${normalizePhoneNumberInput(phoneNumber)}`
}

function buildInternationalWhatsAppDraft(countryCode: string, phoneNumber: string) {
  return `${normalizeCountryCodeInput(countryCode).trim()}${normalizePhoneNumberInput(phoneNumber)}`
}

function validateFriendlyVendorCode(code: string, takenCodes: Set<string>, currentCode?: string) {
  const normalizedCode = normalizeFriendlyVendorCodeInput(code)
  if (!normalizedCode) {
    return null
  }

  if (normalizedCode.length < 3) {
    return "Usa al menos 3 caracteres."
  }

  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(normalizedCode)) {
    return "Solo letras, números y guiones intermedios."
  }

  if (takenCodes.has(normalizedCode) && normalizedCode !== currentCode) {
    return "Ese código ya está en uso."
  }

  return null
}

function vendorCodeCanBeEdited(vendor: VendorSummary) {
  return (
    vendor.ordersCount === 0 &&
    vendor.sales === 0 &&
    vendor.commissions === 0 &&
    vendor.pendingCommissions === 0 &&
    vendor.paidCommissions === 0
  )
}

function ActionIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  )
}

function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ActionIcon {...props}>
      <path d="M1.25 10S4.5 4.75 10 4.75 18.75 10 18.75 10 15.5 15.25 10 15.25 1.25 10 1.25 10Z" />
      <circle cx="10" cy="10" r="2.5" />
    </ActionIcon>
  )
}

function PencilIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ActionIcon {...props}>
      <path d="m14.5 3.5 2 2a1.4 1.4 0 0 1 0 2l-7.75 7.75-3.25.75.75-3.25L14.5 3.5Z" />
      <path d="M13 5l2 2" />
    </ActionIcon>
  )
}

function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ActionIcon {...props}>
      <rect x="6.5" y="6.5" width="9" height="9" rx="2" />
      <path d="M4.5 12.5h-.25A1.75 1.75 0 0 1 2.5 10.75v-6.5A1.75 1.75 0 0 1 4.25 2.5h6.5A1.75 1.75 0 0 1 12.5 4.25v.25" />
    </ActionIcon>
  )
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <ActionIcon {...props}>
      <path d="M3.75 5.5h12.5" />
      <path d="M7.25 5.5V4.25A1.75 1.75 0 0 1 9 2.5h2A1.75 1.75 0 0 1 12.75 4.25V5.5" />
      <path d="M6 7.5v7" />
      <path d="M10 7.5v7" />
      <path d="M14 7.5v7" />
      <path d="M5.25 5.5l.6 10.16A1.75 1.75 0 0 0 7.6 17.25h4.8a1.75 1.75 0 0 0 1.75-1.59l.6-10.16" />
    </ActionIcon>
  )
}

type ActionIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tone?: "primary" | "secondary" | "danger"
  children: ReactNode
}

function ActionIconButton({ label, tone = "secondary", className, children, ...props }: ActionIconButtonProps) {
  const tones = {
    primary: "bg-[#132016] text-white shadow-[0_10px_24px_rgba(19,32,22,0.12)] hover:bg-[#1d3021]",
    secondary: "border border-black/10 bg-white text-[#132016] hover:border-[#52b788]/55 hover:bg-[#f5fbf7]",
    danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-300"
  } satisfies Record<NonNullable<ActionIconButtonProps["tone"]>, string>

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition focus:outline-none focus:ring-2 focus:ring-[#52b788]/50 disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className ?? ""}`}
        {...props}
      >
        <span className="h-4 w-4">{children}</span>
      </button>
      <div className="pointer-events-none absolute bottom-[calc(100%+0.55rem)] left-1/2 z-30 -translate-x-1/2 rounded-xl bg-[#132016] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-[0_12px_24px_rgba(19,32,22,0.18)] transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </div>
    </div>
  )
}

type VendorEditFormState = {
  id: string
  code: string
  name: string
  email: string
  city: string
  phoneCountryCode: string
  phoneNumber: string
  source: string
  collaborationType: VendorCollaborationType
  status: VendorStatus
  notes: string
}

function splitInternationalPhone(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, " ")
  if (!normalized) {
    return {
      phoneCountryCode: DEFAULT_MANUAL_VENDOR_COUNTRY_CODE,
      phoneNumber: ""
    }
  }

  const match = normalized.match(/^(\+\d{1,4})\s*(\d{7,14})$/)
  if (match) {
    return {
      phoneCountryCode: match[1],
      phoneNumber: match[2]
    }
  }

  const compact = normalized.replace(/\s+/g, "")
  const compactMatch = compact.match(/^(\+\d{1,4})(\d{7,14})$/)
  if (compactMatch) {
    return {
      phoneCountryCode: compactMatch[1],
      phoneNumber: compactMatch[2]
    }
  }

  return {
    phoneCountryCode: DEFAULT_MANUAL_VENDOR_COUNTRY_CODE,
    phoneNumber: normalizePhoneNumberInput(normalized)
  }
}

function createVendorEditForm(vendor?: VendorSummary): VendorEditFormState {
  const phone = splitInternationalPhone(vendor?.phone)

  return {
    id: vendor?.id ?? "",
    code: vendor?.code ?? "",
    name: vendor?.name ?? "",
    email: vendor?.email ?? "",
    city: vendor?.city ?? "",
    phoneCountryCode: phone.phoneCountryCode,
    phoneNumber: phone.phoneNumber,
    source: vendor?.source ?? "Alta manual desde admin",
    collaborationType: vendor?.collaborationType ?? VendorCollaborationType.Seller,
    status: vendor?.status ?? VendorStatus.Active,
    notes: ""
  }
}

function vendorCanBeDeleted(vendor: VendorSummary) {
  return (
    vendor.sales === 0 &&
    vendor.commissions === 0 &&
    vendor.pendingCommissions === 0 &&
    vendor.paidCommissions === 0 &&
    vendor.ordersCount === 0 &&
    vendor.applicationsCount === 0
  )
}

export function VendorsWorkspace() {
  const [applications, setApplications] = useState<VendorApplicationSummary[]>([])
  const [vendors, setVendors] = useState<VendorSummary[]>([])
  const [codes, setCodes] = useState<VendorCodeSummary[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [vendorDetailOpen, setVendorDetailOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<VendorSummary | null>(null)
  const [editingVendor, setEditingVendor] = useState<VendorSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VendorSummary | null>(null)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("pending")
  const [reviewer, setReviewer] = useState("seller_manager")
  const [reviewNotes, setReviewNotes] = useState("Revisión comercial.")
  const [approvalTypes, setApprovalTypes] = useState<Record<string, VendorCollaborationType>>({})
  const [approvalCodes, setApprovalCodes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [applicationsError, setApplicationsError] = useState<string | null>(null)
  const [vendorsError, setVendorsError] = useState<string | null>(null)
  const [codesError, setCodesError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [manualVendorPhoneTouched, setManualVendorPhoneTouched] = useState(false)
  const [editVendorPhoneTouched, setEditVendorPhoneTouched] = useState(false)
  const [manualVendor, setManualVendor] = useState({
    name: "",
    email: "",
    city: "",
    phoneCountryCode: DEFAULT_MANUAL_VENDOR_COUNTRY_CODE,
    phoneNumber: "",
    preferredCode: "",
    source: "Alta manual desde admin",
    notes: "",
    collaborationType: VendorCollaborationType.Seller,
    enableCommission: true
  })
  const [editVendorForm, setEditVendorForm] = useState<VendorEditFormState>(() => createVendorEditForm())

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)

      const [applicationsResult, vendorsResult, codesResult] = await Promise.allSettled([
        fetchVendorApplications(),
        fetchVendors(),
        fetchVendorCodes()
      ])

      if (!active) {
        return
      }

      if (applicationsResult.status === "fulfilled") {
        setApplications(applicationsResult.value.data)
        setApplicationsError(null)
        setApprovalTypes((current) => {
          const next = { ...current }
          for (const application of applicationsResult.value.data) {
            next[application.id] = current[application.id] ?? defaultApprovalType(application)
          }
          return next
        })
      } else {
        setApplicationsError(toErrorMessage(applicationsResult.reason, "No pudimos cargar las postulaciones."))
      }

      if (vendorsResult.status === "fulfilled") {
        setVendors(vendorsResult.value.data)
        setVendorsError(null)
      } else {
        setVendorsError(toErrorMessage(vendorsResult.reason, "No pudimos cargar el consolidado de vendedores."))
      }

      if (codesResult.status === "fulfilled") {
        setCodes(codesResult.value.data)
        setCodesError(null)
      } else {
        setCodesError(toErrorMessage(codesResult.reason, "No pudimos cargar los códigos comerciales."))
      }

      setLoading(false)
    }

    void loadData()

    return () => {
      active = false
    }
  }, [refreshKey])

  const sortedVendors = useMemo(
    () =>
      [...vendors].sort((left, right) => {
        if (left.status !== right.status) {
          return left.status === "active" ? -1 : 1
        }

        if (left.sales !== right.sales) {
          return right.sales - left.sales
        }

        return left.name.localeCompare(right.name, "es")
      }),
    [vendors]
  )

  const reviewStats = useMemo(
    () => ({
      pending: applications.filter((application) => application.status === "submitted").length,
      screening: applications.filter((application) => application.status === "screening").length,
      resolved: applications.filter((application) => isResolvedApplication(application.status)).length
    }),
    [applications]
  )

  const filteredApplications = useMemo(() => {
    if (reviewFilter === "all") {
      return applications
    }

    if (reviewFilter === "resolved") {
      return applications.filter((application) => isResolvedApplication(application.status))
    }

    return applications.filter((application) => application.status === "submitted" || application.status === "screening")
  }, [applications, reviewFilter])

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) ?? null,
    [applications, selectedApplicationId]
  )

  function refresh() {
    setRefreshKey((current) => current + 1)
  }

  function resetManualVendorForm() {
    setManualVendor({
      name: "",
      email: "",
      city: "",
      phoneCountryCode: DEFAULT_MANUAL_VENDOR_COUNTRY_CODE,
      phoneNumber: "",
      preferredCode: "",
      source: "Alta manual desde admin",
      notes: "",
      collaborationType: VendorCollaborationType.Seller,
      enableCommission: true
    })
    setManualVendorPhoneTouched(false)
  }

  function openCreateModal() {
    setActionError(null)
    setFeedback(null)
    resetManualVendorForm()
    setCreateModalOpen(true)
  }

  function openVendorDetail(vendor: VendorSummary) {
    setSelectedVendor(vendor)
    setVendorDetailOpen(true)
  }

  function openEditVendor(vendor: VendorSummary) {
    setActionError(null)
    setFeedback(null)
    setEditingVendor(vendor)
    setEditVendorForm(createVendorEditForm(vendor))
    setEditVendorPhoneTouched(false)
    setEditModalOpen(true)
  }

  function openDeleteVendor(vendor: VendorSummary) {
    setActionError(null)
    setFeedback(null)
    setDeleteTarget(vendor)
    setDeleteModalOpen(true)
  }

  function openReviewModal(application: VendorApplicationSummary) {
    setActionError(null)
    setFeedback(null)
    setApprovalTypes((current) => ({
      ...current,
      [application.id]: current[application.id] ?? defaultApprovalType(application)
    }))
    setApprovalCodes((current) => ({
      ...current,
      [application.id]: current[application.id] ?? ""
    }))
    setSelectedApplicationId(application.id)
    setReviewModalOpen(true)
  }

  async function handleCopyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setFeedback(`Código ${code} copiado.`)
    } catch (error) {
      setActionError(toErrorMessage(error, "No pudimos copiar el código del vendedor."))
    }
  }

  async function handleApplicationAction(application: VendorApplicationSummary, action: "screen" | "approve" | "reject") {
    if (action === "approve" && selectedApprovalCodeError) {
      setActionError(selectedApprovalCodeError)
      return
    }

    setActionLoading(true)
    setActionError(null)
    setFeedback(null)

    try {
      const preferredCode = normalizeFriendlyVendorCodeInput(approvalCodes[application.id] ?? "")
      const payload = {
        reviewer: reviewer.trim() || undefined,
        notes: reviewNotes.trim() || undefined,
        resolvedCollaborationType:
          action === "approve"
            ? approvalTypes[application.id] ?? defaultApprovalType(application)
            : undefined,
        preferredCode: action === "approve" && preferredCode ? preferredCode : undefined
      }

      const response =
        action === "screen"
          ? await screenVendorApplication(application.id, payload)
          : action === "approve"
            ? await approveVendorApplication(application.id, payload)
            : await rejectVendorApplication(application.id, payload)

      setFeedback(response.message)
      setReviewModalOpen(false)
      setSelectedApplicationId(null)
      refresh()
    } catch (error) {
      setActionError(toErrorMessage(error, "No pudimos procesar la postulación."))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCreateManualVendor() {
    setActionError(null)
    setFeedback(null)

    if (manualVendorCodeError) {
      setActionError(manualVendorCodeError)
      return
    }

    const phone = buildInternationalWhatsApp(manualVendor.phoneCountryCode, manualVendor.phoneNumber)

    if (!phone) {
      setManualVendorPhoneTouched(true)
      return
    }

    setActionLoading(true)

    try {
      const response = await createVendor({
        name: manualVendor.name.trim(),
        email: manualVendor.email.trim(),
        city: manualVendor.city.trim(),
        phone,
        preferredCode: normalizeFriendlyVendorCodeInput(manualVendor.preferredCode) || undefined,
        source: manualVendor.source.trim() || undefined,
        notes: manualVendor.notes.trim() || undefined,
        collaborationType: manualVendor.collaborationType,
        enableCommission: manualVendor.enableCommission
      })

      if (
        manualVendor.enableCommission &&
        manualVendor.collaborationType === VendorCollaborationType.Affiliate &&
        response.vendor?.code
      ) {
        await createCommissionRule({
          name: `Afiliado ${response.vendor.code} 10%`,
          description: `Regla automática para ${response.vendor.name} con comisión base de afiliado.`,
          scope: "vendor",
          rate: 0.1,
          paymentMethod: "any",
          appliesToVendorCode: response.vendor.code,
          appliesToCollaborationType: VendorCollaborationType.Affiliate,
          payoutDelayDays: 7,
          notes: "Creada automáticamente al dar de alta un afiliado desde admin.",
          priority: 10,
          status: "active"
        })
      }

      setFeedback(
        manualVendor.enableCommission && manualVendor.collaborationType === VendorCollaborationType.Affiliate
          ? "Vendedor creado y regla 10% para afiliado registrada."
          : response.message
      )
      resetManualVendorForm()
      setCreateModalOpen(false)
      refresh()
    } catch (error) {
      setActionError(toErrorMessage(error, "No pudimos dar de alta al vendedor."))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUpdateVendor() {
    if (!editingVendor) {
      return
    }

    setActionError(null)
    setFeedback(null)

    if (editVendorCodeError) {
      setActionError(editVendorCodeError)
      return
    }

    const phone = buildInternationalWhatsApp(editVendorForm.phoneCountryCode, editVendorForm.phoneNumber)
    if (!phone) {
      setEditVendorPhoneTouched(true)
      return
    }

    setActionLoading(true)

    try {
      const response = await updateVendor(editingVendor.id, {
        name: editVendorForm.name.trim(),
        email: editVendorForm.email.trim(),
        city: editVendorForm.city.trim(),
        phone,
        preferredCode: editVendorCodeValue,
        source: editVendorForm.source.trim() || undefined,
        collaborationType: editVendorForm.collaborationType,
        status: editVendorForm.status,
        notes: editVendorForm.notes.trim() || undefined
      })

      setFeedback(response.message)
      if (selectedVendor?.id === editingVendor.id && response.vendor) {
        setSelectedVendor(response.vendor)
      }
      setEditModalOpen(false)
      setEditingVendor(null)
      refresh()
    } catch (error) {
      setActionError(toErrorMessage(error, "No pudimos actualizar el vendedor."))
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteVendor() {
    if (!deleteTarget) {
      return
    }

    setActionLoading(true)
    setActionError(null)
    setFeedback(null)

    try {
      const response = await deleteVendor(deleteTarget.id)
      setFeedback(response.message)
      if (selectedVendor?.id === deleteTarget.id) {
        setSelectedVendor(null)
        setVendorDetailOpen(false)
      }
      setDeleteModalOpen(false)
      setDeleteTarget(null)
      refresh()
    } catch (error) {
      setActionError(toErrorMessage(error, "No pudimos eliminar el vendedor."))
    } finally {
      setActionLoading(false)
    }
  }

  const selectedApprovalType = selectedApplication
    ? approvalTypes[selectedApplication.id] ?? defaultApprovalType(selectedApplication)
    : VendorCollaborationType.Seller

  const canScreenSelected = selectedApplication?.status === "submitted"
  const canResolveSelected = selectedApplication?.status === "screening"
  const manualVendorPhoneError = validateInternationalWhatsApp(manualVendor.phoneCountryCode, manualVendor.phoneNumber)
  const takenVendorCodes = useMemo(
    () => new Set([...codes.map((code) => code.code.toUpperCase()), ...vendors.map((vendor) => vendor.code.toUpperCase())]),
    [codes, vendors]
  )
  const manualVendorCodeValue = normalizeFriendlyVendorCodeInput(manualVendor.preferredCode)
  const manualVendorCodeError = validateFriendlyVendorCode(manualVendor.preferredCode, takenVendorCodes)
  const selectedApprovalCode = normalizeFriendlyVendorCodeInput(selectedApplication ? approvalCodes[selectedApplication.id] ?? "" : "")
  const selectedApprovalCodeError = validateFriendlyVendorCode(
    selectedApplication ? approvalCodes[selectedApplication.id] ?? "" : "",
    takenVendorCodes,
    selectedApplication?.vendorCode?.toUpperCase()
  )
  const editVendorPhoneError = validateInternationalWhatsApp(editVendorForm.phoneCountryCode, editVendorForm.phoneNumber)
  const editVendorPhonePreview = buildInternationalWhatsApp(editVendorForm.phoneCountryCode, editVendorForm.phoneNumber)
  const editVendorCodeValue = normalizeFriendlyVendorCodeInput(editVendorForm.code)
  const canEditVendorCode = editingVendor ? vendorCodeCanBeEdited(editingVendor) : false
  const editVendorCodeError =
    editingVendor && !editVendorCodeValue
      ? "El código comercial es obligatorio."
      : editingVendor
        ? validateFriendlyVendorCode(editVendorForm.code, takenVendorCodes, editingVendor.code.toUpperCase())
        : null
  const canDeleteSelectedVendor = deleteTarget ? vendorCanBeDeleted(deleteTarget) : false

  return (
    <div className="space-y-6 pb-8">
      <SectionHeader
        title="Vendedores"
        description="Recibe postulaciones, aprueba nuevos canales y sigue quién ya está vendiendo o recomendando."
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm text-black/55">
            El flujo es simple: entra una solicitud, la revisas, decides si avanza y, cuando aprueba, queda lista para vender con su código.
          </p>
        </div>
        <Button type="button" onClick={() => openCreateModal()}>
          + Nuevo vendedor
        </Button>
      </div>

      <AdminDataTable
        title="Vendedores"
        description="Directorio operativo con identidad comercial, estado y acciones para gestionar perfiles."
        headers={["Nombre", "Código", "Tipo", "Estado", "Ciudad", "Acciones"]}
        rows={sortedVendors.map((vendor) => [
          <div key={`${vendor.code}-name`} className="space-y-1">
            <div className="font-semibold text-[#132016]">{vendor.name}</div>
            <div className="text-xs text-black/45">{vendor.email ?? "Sin email"}</div>
          </div>,
          <span key={`${vendor.code}-code`} className="font-medium text-[#132016]">{vendor.code}</span>,
          collaborationTypeLabel(vendor.collaborationType),
          <StatusBadge key={`${vendor.code}-status`} label={vendorStatusLabel(vendor.status)} tone={vendorTone(vendor.status)} />,
          vendor.city ?? "Sin ciudad",
          <div key={`${vendor.code}-actions`} className="flex flex-wrap items-center gap-2">
            <ActionIconButton label="Ver resumen" tone="primary" onClick={() => openVendorDetail(vendor)}>
              <EyeIcon className="h-4 w-4" />
            </ActionIconButton>
            <ActionIconButton label="Editar datos y código" onClick={() => openEditVendor(vendor)}>
              <PencilIcon className="h-4 w-4" />
            </ActionIconButton>
            <ActionIconButton label="Copiar código" onClick={() => void handleCopyCode(vendor.code)}>
              <CopyIcon className="h-4 w-4" />
            </ActionIconButton>
            <ActionIconButton label="Eliminar vendedor" tone="danger" onClick={() => openDeleteVendor(vendor)}>
              <TrashIcon className="h-4 w-4" />
            </ActionIconButton>
          </div>
        ])}
      />
      {vendorsError ? <p className="text-sm text-rose-700">{vendorsError}</p> : null}

      <div className="flex flex-col gap-3 rounded-[1.6rem] border border-black/8 bg-white/70 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            { label: "Por revisar", value: reviewStats.pending + reviewStats.screening },
            { label: "En evaluación", value: reviewStats.screening },
            { label: "Resueltas", value: reviewStats.resolved }
          ].map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center rounded-full border border-black/8 bg-[#f7f8f4] px-3 py-1.5 text-[#132016]"
            >
              <span className="font-medium">{item.label}</span>
              <span className="ml-2 text-black/55">{item.value}</span>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { key: "pending", label: "Por revisar", count: reviewStats.pending + reviewStats.screening },
            { key: "resolved", label: "Ya resueltas", count: reviewStats.resolved },
            { key: "all", label: "Ver todas", count: applications.length }
          ].map((filter) => {
            const isActive = reviewFilter === filter.key

            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setReviewFilter(filter.key as ReviewFilter)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-[#1a3a2e] text-white"
                    : "border border-black/10 bg-white text-[#132016] hover:border-[#52b788] hover:bg-[#f5fbf7]"
                }`}
              >
                {filter.label} · {filter.count}
              </button>
            )
          })}
        </div>
      </div>

      <AdminDataTable
        title="Solicitudes"
        description={`${filteredApplications.length} caso(s) visibles en la bandeja actual. La revisión se resuelve directo desde esta lista.`}
        headers={["Persona", "Qué busca", "Etapa", "Origen", "Último cambio", "Acciones"]}
        rows={filteredApplications.map((application) => [
          <div key={`${application.id}-identity`} className="space-y-1">
            <div className="font-semibold text-[#132016]">{application.name}</div>
            <div className="text-xs text-black/45">{application.email}</div>
            <div className="text-xs text-black/40">
              {application.city} · {application.phone ?? "Sin teléfono"}
            </div>
          </div>,
          <div key={`${application.id}-intent`} className="space-y-1">
            <div>{applicationIntentLabel(application.applicationIntent)}</div>
            {application.resolvedCollaborationType ? (
              <div className="text-xs text-black/45">
                Resuelto como {collaborationTypeLabel(application.resolvedCollaborationType)}
              </div>
            ) : null}
          </div>,
          <StatusBadge
            key={`${application.id}-status`}
            label={applicationStatusLabel(application.status)}
            tone={applicationTone(application.status)}
          />,
          <div key={`${application.id}-source`} className="space-y-1">
            <div>{application.source}</div>
            {application.vendorCode ? <div className="text-xs text-[#2d6a4f]">Código {application.vendorCode}</div> : null}
          </div>,
          formatDate(application.updatedAt),
          <div key={`${application.id}-actions`} className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openReviewModal(application)}>
              Revisar
            </Button>
            {application.vendorCode ? (
              <Button size="sm" variant="secondary" onClick={() => void handleCopyCode(application.vendorCode as string)}>
                Copiar código
              </Button>
            ) : null}
          </div>
        ])}
      />
      {!filteredApplications.length ? (
        <p className="text-sm text-black/55">No hay postulaciones en la bandeja seleccionada.</p>
      ) : null}
      {applicationsError ? <p className="text-sm text-rose-700">{applicationsError}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Cómo funciona</CardTitle>
          <CardDescription>
            La solicitud entra desde web, se evalúa y recién al aprobar se genera el código comercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-black/65">
          <p>1. El cliente envía su postulación desde el storefront con intención comercial y WhatsApp.</p>
          <p>2. Operación revisa la cola, abre cada caso y lo pasa a evaluación o lo cierra.</p>
          <p>3. Si se aprueba, el vendedor queda activo con código listo para atribución.</p>
          <p>4. Las ventas con código alimentan pedidos, reportes y comisiones.</p>
        </CardContent>
      </Card>

      {feedback ? <p className="text-sm text-[#2d6a4f]">{feedback}</p> : null}
      {actionError ? <p className="text-sm text-rose-700">{actionError}</p> : null}
      {codesError ? <p className="text-sm text-rose-700">{codesError}</p> : null}
      {loading ? <p className="text-sm text-black/55">Actualizando vendedores...</p> : null}
      <Separator />

      <Dialog open={createModalOpen} onClose={() => !actionLoading && setCreateModalOpen(false)} size="xl">
        <DialogContent className="overflow-hidden">
          <DialogHeader className="px-6 py-6 md:px-8 md:py-7">
            <DialogTitle className="text-2xl md:text-[2rem]">Nuevo vendedor</DialogTitle>
            <DialogDescription className="mt-2 max-w-3xl text-base leading-7 text-black/55">
              Da de alta vendedores o afiliados sin esperar una solicitud desde la web.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6 px-6 py-6 md:px-8 md:py-7">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.95fr)]">
              <div className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 md:p-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-name">
                      Nombre
                    </label>
                    <Input
                      id="manual-vendor-name"
                      required
                      value={manualVendor.name}
                      onChange={(event) => setManualVendor((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Nombre comercial"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-email">
                      Email
                    </label>
                    <Input
                      id="manual-vendor-email"
                      type="email"
                      required
                      value={manualVendor.email}
                      onChange={(event) => setManualVendor((current) => ({ ...current, email: event.target.value }))}
                      placeholder="seller@huelegood.com"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-city">
                      Ciudad
                    </label>
                    <Input
                      id="manual-vendor-city"
                      required
                      value={manualVendor.city}
                      onChange={(event) => setManualVendor((current) => ({ ...current, city: event.target.value }))}
                      placeholder="Lima"
                      autoComplete="address-level2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-phone">
                      WhatsApp
                    </label>
                    <PhoneInput
                      value={buildInternationalWhatsAppDraft(manualVendor.phoneCountryCode, manualVendor.phoneNumber)}
                      defaultCountry="pe"
                      preferredCountries={[...PREFERRED_PHONE_COUNTRIES]}
                      forceDialCode
                      disableDialCodeAndPrefix
                      showDisabledDialCodeAndPrefix
                      placeholder="Número de WhatsApp"
                      className={manualVendorPhoneTouched && manualVendorPhoneError ? "admin-phone-input admin-phone-input--error" : "admin-phone-input"}
                      onBlur={() => setManualVendorPhoneTouched(true)}
                      inputProps={{
                        id: "manual-vendor-phone",
                        autoComplete: "tel-national",
                        inputMode: "tel"
                      }}
                      onChange={(_, meta) => {
                        setManualVendor((current) => ({
                          ...current,
                          phoneCountryCode: `+${meta.country.dialCode}`,
                          phoneNumber: normalizePhoneNumberInput(meta.inputValue)
                        }))
                      }}
                    />
                    {manualVendorPhoneTouched && manualVendorPhoneError ? (
                      <p className="text-xs text-rose-700">{manualVendorPhoneError}</p>
                    ) : (
                      <p className="text-xs text-black/45">
                        Perú viene preseleccionado. Si hace falta, cambia el país y luego escribe el número de WhatsApp.
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-notes">
                    Notas
                  </label>
                  <Textarea
                    id="manual-vendor-notes"
                    value={manualVendor.notes}
                    onChange={(event) => setManualVendor((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Canal, contexto comercial o alcance."
                    className="min-h-[128px] bg-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 md:p-6">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Configuración comercial</div>
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-type">
                        Tipo comercial
                      </label>
                      <select
                        id="manual-vendor-type"
                        value={manualVendor.collaborationType}
                        onChange={(event) =>
                          setManualVendor((current) => ({
                            ...current,
                            collaborationType: event.target.value as VendorCollaborationType
                          }))
                        }
                        className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#132016]"
                      >
                        <option value={VendorCollaborationType.Seller}>Vendedor</option>
                        <option value={VendorCollaborationType.Affiliate}>Afiliado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-code">
                        Código comercial
                      </label>
                      <Input
                        id="manual-vendor-code"
                        value={manualVendor.preferredCode}
                        onChange={(event) =>
                          setManualVendor((current) => ({
                            ...current,
                            preferredCode: normalizeFriendlyVendorCodeInput(event.target.value)
                          }))
                        }
                        placeholder="RAPHA-LIMA"
                        className={manualVendorCodeError ? "border-rose-300 focus:border-rose-400" : undefined}
                      />
                      {manualVendorCodeError ? (
                        <p className="text-xs text-rose-700">{manualVendorCodeError}</p>
                      ) : (
                        <p className="text-xs text-black/45">
                          {manualVendorCodeValue
                            ? `Se usará ${manualVendorCodeValue}. Si lo dejas vacío, se genera automáticamente.`
                            : "Opcional. Si lo dejas vacío, se genera automáticamente."}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="manual-vendor-source">
                        Origen
                      </label>
                      <Input
                        id="manual-vendor-source"
                        value={manualVendor.source}
                        onChange={(event) => setManualVendor((current) => ({ ...current, source: event.target.value }))}
                        placeholder="Alta manual desde admin"
                      />
                      <p className="text-xs text-black/45">Se usa para trazabilidad interna del alta.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-black/8 bg-[#fbfbf8] p-5 md:p-6">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Comisiones</div>
                  <label className="mt-4 flex items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-4">
                    <input
                      type="checkbox"
                      checked={manualVendor.enableCommission}
                      onChange={(event) => setManualVendor((current) => ({ ...current, enableCommission: event.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-black/20"
                    />
                    <span className="text-sm leading-6 text-[#132016]">
                      Si es afiliado, crear automáticamente la regla base de comisión al <strong>10%</strong>.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="justify-between px-6 py-5 md:px-8">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleCreateManualVendor()} disabled={actionLoading}>
              {actionLoading ? "Guardando..." : "Crear vendedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewModalOpen} onClose={() => !actionLoading && setReviewModalOpen(false)} size="xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedApplication ? `Revisar solicitud: ${selectedApplication.name}` : "Revisar solicitud"}</DialogTitle>
            <DialogDescription>La decisión se toma por caso para mantener la bandeja limpia y ordenada.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            {selectedApplication ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Etapa", value: applicationStatusLabel(selectedApplication.status) },
                    { label: "Intención", value: applicationIntentLabel(selectedApplication.applicationIntent) },
                    { label: "Origen", value: selectedApplication.source },
                    { label: "Código", value: selectedApplication.vendorCode ?? "Pendiente" }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-[#132016]">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-[#fbfbf8] px-4 py-3 text-sm text-black/65">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Contacto</div>
                    <div className="mt-2 font-medium text-[#132016]">{selectedApplication.email}</div>
                    <div className="mt-1">{selectedApplication.city} · {selectedApplication.phone ?? "Sin teléfono"}</div>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-[#fbfbf8] px-4 py-3 text-sm text-black/65">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Mensaje</div>
                    <div className="mt-2">{selectedApplication.message ?? "Sin contexto adicional."}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="vendor-reviewer">
                      Revisor
                    </label>
                    <Input
                      id="vendor-reviewer"
                      value={reviewer}
                      onChange={(event) => setReviewer(event.target.value)}
                      placeholder="seller_manager"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="vendor-approval-type">
                      Tipo al aprobar
                    </label>
                    <select
                      id="vendor-approval-type"
                      value={selectedApprovalType}
                      onChange={(event) =>
                        setApprovalTypes((current) => ({
                          ...current,
                          [selectedApplication.id]: event.target.value as VendorCollaborationType
                        }))
                      }
                      disabled={!canResolveSelected || actionLoading}
                      className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-[#132016] disabled:bg-black/[0.03]"
                    >
                      <option value={VendorCollaborationType.Seller}>Vendedor</option>
                      <option value={VendorCollaborationType.Affiliate}>Afiliado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="vendor-approval-code">
                      Código comercial
                    </label>
                    <Input
                      id="vendor-approval-code"
                      value={selectedApplication ? approvalCodes[selectedApplication.id] ?? "" : ""}
                      onChange={(event) =>
                        selectedApplication
                          ? setApprovalCodes((current) => ({
                              ...current,
                              [selectedApplication.id]: normalizeFriendlyVendorCodeInput(event.target.value)
                            }))
                          : undefined
                      }
                      disabled={!canResolveSelected || actionLoading}
                      placeholder="RAPHA-LIMA"
                      className={selectedApprovalCodeError ? "border-rose-300 focus:border-rose-400" : undefined}
                    />
                    {selectedApprovalCodeError ? (
                      <p className="text-xs text-rose-700">{selectedApprovalCodeError}</p>
                    ) : (
                      <p className="text-xs text-black/45">
                        {selectedApprovalCode
                          ? `Se aprobará con ${selectedApprovalCode}. Si lo dejas vacío, se genera automático.`
                          : "Opcional. Si lo dejas vacío, se genera automáticamente."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#132016]" htmlFor="vendor-review-notes">
                    Notas de revisión
                  </label>
                  <Input
                    id="vendor-review-notes"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    placeholder="Notas de la decisión"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-black/55">Selecciona una postulación desde la tabla para revisarla.</p>
            )}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setReviewModalOpen(false)} disabled={actionLoading}>
              Cerrar
            </Button>
            {selectedApplication ? (
              <div className="flex flex-wrap justify-end gap-2">
                {selectedApplication.vendorCode ? (
                  <Button type="button" variant="secondary" onClick={() => void handleCopyCode(selectedApplication.vendorCode as string)}>
                    Copiar código
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant={canScreenSelected ? "primary" : "secondary"}
                  onClick={() => void handleApplicationAction(selectedApplication, "screen")}
                  disabled={actionLoading || !canScreenSelected}
                >
                  Pasar a evaluación
                </Button>
                  <Button
                    type="button"
                    onClick={() => void handleApplicationAction(selectedApplication, "approve")}
                    disabled={actionLoading || !canResolveSelected || Boolean(selectedApprovalCodeError)}
                  >
                    Aprobar
                  </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleApplicationAction(selectedApplication, "reject")}
                  disabled={actionLoading || !canResolveSelected}
                >
                  Rechazar
                </Button>
              </div>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onClose={() => !actionLoading && setEditModalOpen(false)} size="xl">
        <DialogContent className="overflow-hidden">
          <DialogHeader className="px-6 py-6 md:px-8 md:py-7">
            <DialogTitle className="text-2xl md:text-[2rem]">
              {editingVendor ? `Editar vendedor: ${editingVendor.name}` : "Editar vendedor"}
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-3xl text-base leading-7 text-black/55">
              Actualiza datos comerciales, estado operativo y, si todavía no hay historial comercial, también su código.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6 px-6 py-6 md:px-8 md:py-7">
            {editingVendor ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.95fr)]">
                <div className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 md:p-6">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-name">
                        Nombre
                      </label>
                      <Input
                        id="edit-vendor-name"
                        value={editVendorForm.name}
                        onChange={(event) => setEditVendorForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Nombre comercial"
                        autoComplete="off"
                        name="edit-vendor-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-email">
                        Email
                      </label>
                      <Input
                        id="edit-vendor-email"
                        type="email"
                        value={editVendorForm.email}
                        onChange={(event) => setEditVendorForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="seller@huelegood.com"
                        autoComplete="off"
                        name="edit-vendor-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-city">
                        Ciudad
                      </label>
                      <Input
                        id="edit-vendor-city"
                        value={editVendorForm.city}
                        onChange={(event) => setEditVendorForm((current) => ({ ...current, city: event.target.value }))}
                        placeholder="Lima"
                        autoComplete="off"
                        name="edit-vendor-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-phone">
                        WhatsApp
                      </label>
                      <PhoneInput
                        value={buildInternationalWhatsAppDraft(editVendorForm.phoneCountryCode, editVendorForm.phoneNumber)}
                        defaultCountry="pe"
                        preferredCountries={[...PREFERRED_PHONE_COUNTRIES]}
                        forceDialCode
                        disableDialCodeAndPrefix
                        showDisabledDialCodeAndPrefix
                        placeholder="Número de WhatsApp"
                        className={editVendorPhoneTouched && editVendorPhoneError ? "admin-phone-input admin-phone-input--error" : "admin-phone-input"}
                        onBlur={() => setEditVendorPhoneTouched(true)}
                        inputProps={{
                          id: "edit-vendor-phone",
                          autoComplete: "off",
                          inputMode: "tel",
                          name: "edit-vendor-phone"
                        }}
                        onChange={(_, meta) => {
                          setEditVendorForm((current) => ({
                            ...current,
                            phoneCountryCode: `+${meta.country.dialCode}`,
                            phoneNumber: normalizePhoneNumberInput(meta.inputValue)
                          }))
                        }}
                      />
                      {editVendorPhoneTouched && editVendorPhoneError ? (
                        <p className="text-xs text-rose-700">{editVendorPhoneError}</p>
                      ) : (
                        <p className="text-xs text-black/45">
                          {editVendorPhonePreview
                            ? `Se guardará como ${editVendorPhonePreview}.`
                            : "Usa formato internacional. Ejemplo: +51 998906481."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-notes">
                      Nota interna del cambio
                    </label>
                    <Textarea
                      id="edit-vendor-notes"
                      value={editVendorForm.notes}
                      onChange={(event) => setEditVendorForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="Qué cambió y por qué."
                      className="min-h-[128px] bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 md:p-6">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Identidad comercial</div>
                    <div className="mt-4 space-y-4 rounded-2xl border border-black/10 bg-white px-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-code">
                          Código comercial
                        </label>
                        <Input
                          id="edit-vendor-code"
                          value={editVendorForm.code}
                          onChange={(event) =>
                            setEditVendorForm((current) => ({
                              ...current,
                              code: normalizeFriendlyVendorCodeInput(event.target.value)
                            }))
                          }
                          disabled={!canEditVendorCode || actionLoading}
                          placeholder="RAPHA-LIMA"
                          autoComplete="off"
                          name="edit-vendor-code"
                          spellCheck={false}
                          className={editVendorCodeError ? "border-rose-300 focus:border-rose-400" : undefined}
                        />
                        {editVendorCodeError ? (
                          <p className="text-xs text-rose-700">{editVendorCodeError}</p>
                        ) : canEditVendorCode ? (
                          <p className="text-xs text-black/45">
                            Puedes cambiarlo porque este perfil todavía no tiene ventas ni comisiones históricas. Si hay reglas ligadas al código, también se sincronizan.
                          </p>
                        ) : (
                          <p className="text-xs text-black/45">
                            Este código queda bloqueado cuando ya existen pedidos o comisiones históricas para no romper atribuciones.
                          </p>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-black/8 bg-[#fbfbf8] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Pedidos atribuidos</div>
                          <div className="mt-1 text-sm font-semibold text-[#132016]">{editingVendor.ordersCount}</div>
                        </div>
                        <div className="rounded-2xl border border-black/8 bg-[#fbfbf8] px-4 py-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Comisiones registradas</div>
                          <div className="mt-1 text-sm font-semibold text-[#132016]">
                            {editingVendor.pendingCommissions + editingVendor.paidCommissions}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] border border-black/8 bg-black/[0.02] p-5 md:p-6">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Configuración comercial</div>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-type">
                          Tipo comercial
                        </label>
                        <select
                          id="edit-vendor-type"
                          value={editVendorForm.collaborationType}
                          onChange={(event) =>
                            setEditVendorForm((current) => ({
                              ...current,
                              collaborationType: event.target.value as VendorCollaborationType
                            }))
                          }
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#132016]"
                        >
                          <option value={VendorCollaborationType.Seller}>Vendedor</option>
                          <option value={VendorCollaborationType.Affiliate}>Afiliado</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-status">
                          Estado
                        </label>
                        <select
                          id="edit-vendor-status"
                          value={editVendorForm.status}
                          onChange={(event) =>
                            setEditVendorForm((current) => ({
                              ...current,
                              status: event.target.value as VendorStatus
                            }))
                          }
                          className="h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-[#132016]"
                        >
                          <option value={VendorStatus.Active}>Activo</option>
                          <option value={VendorStatus.Inactive}>Inactivo</option>
                          <option value={VendorStatus.Suspended}>Suspendido</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[#132016]" htmlFor="edit-vendor-source">
                          Origen
                        </label>
                        <Input
                          id="edit-vendor-source"
                          value={editVendorForm.source}
                          onChange={(event) => setEditVendorForm((current) => ({ ...current, source: event.target.value }))}
                          placeholder="Alta manual desde admin"
                          autoComplete="off"
                          name="edit-vendor-source"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-black/55">Selecciona un vendedor para editarlo.</p>
            )}
          </DialogBody>
          <DialogFooter className="justify-between px-6 py-5 md:px-8">
            <Button type="button" variant="secondary" onClick={() => setEditModalOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleUpdateVendor()} disabled={actionLoading || !editingVendor}>
              {actionLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onClose={() => !actionLoading && setDeleteModalOpen(false)} size="md">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteTarget ? `Eliminar vendedor: ${deleteTarget.name}` : "Eliminar vendedor"}</DialogTitle>
            <DialogDescription>
              Esta acción borra el perfil comercial del listado admin. Solo se permite para vendedores sin actividad histórica.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {deleteTarget ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Código", value: deleteTarget.code },
                    { label: "Estado", value: vendorStatusLabel(deleteTarget.status) },
                    { label: "Pedidos", value: String(deleteTarget.ordersCount) },
                    { label: "Postulaciones", value: String(deleteTarget.applicationsCount) }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-[#132016]">{item.value}</div>
                    </div>
                  ))}
                </div>

                {canDeleteSelectedVendor ? (
                  <p className="text-sm text-black/60">
                    No se detectó actividad comercial ni postulaciones asociadas. Puedes eliminar este perfil.
                  </p>
                ) : (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    Este vendedor no se puede eliminar porque ya tiene actividad, comisiones o postulaciones vinculadas.
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-black/55">Selecciona un vendedor para eliminarlo.</p>
            )}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleDeleteVendor()}
              disabled={actionLoading || !deleteTarget || !canDeleteSelectedVendor}
            >
              {actionLoading ? "Eliminando..." : "Eliminar vendedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={vendorDetailOpen} onClose={() => setVendorDetailOpen(false)} size="md">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedVendor?.name ?? "Vendedor"}</DialogTitle>
            <DialogDescription>Resumen operativo del vendedor y su código comercial actual.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {selectedVendor ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Código", value: selectedVendor.code },
                    { label: "Tipo", value: collaborationTypeLabel(selectedVendor.collaborationType) },
                    { label: "Estado", value: vendorStatusLabel(selectedVendor.status) },
                    { label: "Ciudad", value: selectedVendor.city ?? "Sin ciudad" },
                    { label: "Email", value: selectedVendor.email ?? "Sin email" },
                    { label: "WhatsApp", value: selectedVendor.phone ?? "Sin WhatsApp" },
                    { label: "Origen", value: selectedVendor.source ?? "Sin origen" },
                    { label: "Aprobado", value: formatDate(selectedVendor.approvedAt) }
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">{item.label}</div>
                      <div className="mt-1 text-sm font-medium text-[#132016]">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Ventas</div>
                    <div className="mt-1 text-sm font-medium text-[#132016]">{formatCurrency(selectedVendor.sales)}</div>
                    <div className="mt-1 text-xs text-black/45">{selectedVendor.ordersCount} pedido(s) atribuido(s)</div>
                  </div>
                  <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">Comisiones</div>
                    <div className="mt-1 text-sm font-medium text-[#132016]">{formatCurrency(selectedVendor.commissions)}</div>
                    <div className="mt-1 text-xs text-black/45">
                      Pend. {formatCurrency(selectedVendor.pendingCommissions)} · Pag. {formatCurrency(selectedVendor.paidCommissions)}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </DialogBody>
          <DialogFooter className="justify-between">
            <Button type="button" variant="secondary" onClick={() => setVendorDetailOpen(false)}>
              Cerrar
            </Button>
            {selectedVendor ? (
              <Button type="button" onClick={() => void handleCopyCode(selectedVendor.code)}>
                Copiar código
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
