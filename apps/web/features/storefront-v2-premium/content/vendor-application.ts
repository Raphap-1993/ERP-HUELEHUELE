export interface VendorApplicationStep {
  step: string;
  title: string;
  description: string;
}

export const vendorApplicationContent = {
  hero: {
    eyebrow: "Comunidad comercial Huele Huele",
    title: "Trabaja con nosotros si puedes representar bien la marca y moverla con criterio.",
    description:
      "Esta ruta sigue viva como entrada comercial formal. Ahora usa un formulario real conectado al endpoint existente para registrar postulaciones sin inventar backend nuevo.",
    metrics: [
      {
        label: "Perfil",
        value: "Comercial",
        detail: "Buscamos personas con criterio para vender y sostener presencia de marca."
      },
      {
        label: "Proceso",
        value: "Screening",
        detail: "La solicitud entra a revisión y mantiene trazabilidad en el backend actual."
      },
      {
        label: "Salida",
        value: "Código",
        detail: "Si se aprueba, el flujo existente crea la base del onboarding comercial."
      }
    ]
  },
  evaluationChecklist: [
    "Presencia comercial y capacidad para explicar bien el producto.",
    "Ciudad, canal o red donde realmente pueda mover ventas.",
    "Afinidad con una marca premium y con su narrativa pública."
  ],
  sellerBenefits: [
    "Código comercial para atribución de ventas.",
    "Seguimiento de comisiones y estado del proceso.",
    "Ingreso a un canal que ya existe en el ERP y en el admin."
  ],
  steps: [
    {
      step: "01",
      title: "Postulación",
      description: "Recibimos tus datos, ciudad y contexto comercial en un formulario corto y claro."
    },
    {
      step: "02",
      title: "Revisión",
      description: "El equipo valida fit con la marca, potencial comercial y consistencia del perfil."
    },
    {
      step: "03",
      title: "Activación",
      description: "Si el perfil avanza, el flujo actual registra la base del vendedor y su seguimiento."
    }
  ]
} as const;
