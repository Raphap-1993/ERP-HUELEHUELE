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
      "Cuéntanos cómo te gustaría colaborar con la marca. Revisamos cada postulación con atención.",
    metrics: [
      {
        label: "Perfil",
        value: "Comercial",
        detail: "Buscamos personas con criterio para vender y sostener presencia de marca."
      },
      {
        label: "Proceso",
        value: "Screening",
        detail: "Revisamos cada solicitud con criterio comercial y respuesta clara."
      },
      {
        label: "Salida",
        value: "Código",
        detail: "Si tu perfil encaja, te acompañamos en el siguiente paso para empezar."
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
    "Ingreso a un canal comercial con seguimiento claro."
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
      description: "Si el perfil avanza, te acompañamos con la activación y el siguiente paso."
    }
  ]
} as const;
