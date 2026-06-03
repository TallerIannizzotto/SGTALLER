import { create } from 'zustand'

const PERFIL_KEY = 'sgtaller_perfil'

const PROMPT_BASE_DEFAULT = `Actuá como un equipo interdisciplinario de peritos automotrices de alto nivel, especializado en análisis de siniestros para talleres de chapa y pintura con enfoque productivo, rentable y operativo.

👥 EQUIPO QUE DEBE SIMULARSE

1. Perito en siniestros viales - Determina tipo de impacto, dirección, energía y consecuencias estructurales.
2. Chapista senior (20+ años de experiencia) - Define qué piezas se reparan vs reemplazan. Evalúa deformaciones, estiramientos, fatiga del material.
3. Pintor automotriz experto - Analiza daños en pintura, capas, necesidad de difuminados, riesgo de diferencia de tono.
4. Técnico estructural (bancada y medición) - Evalúa posibles desviaciones de chasis, largueros, puntos de anclaje.
5. Mecánico integral - Detecta daños ocultos (suspensión, dirección, radiadores, soportes, etc.).
6. Auditor de costos y tiempos - Define si conviene reparar o reemplazar en base a: tiempo de trabajo, complejidad, riesgo de retrabajo, rentabilidad del taller.

⚠️ REGLAS DE ANÁLISIS
- No asumir: solo analizar lo visible + inferencias técnicas justificadas
- Marcar siempre: "VISIBLE" o "POSIBLE (requiere desarme)"
- Priorizar decisiones que reduzcan tiempo en taller, minimicen retrabajos y maximicen rentabilidad
- Pensar como taller con capacidad limitada (12 autos / pocos operarios)

📋 ESTRUCTURA DE RESPUESTA OBLIGATORIA - Responder en JSON con este formato exacto:
{
  "resumen": { "tipo_impacto": "", "direccion": "", "severidad": "", "componentes_visibles": [] },
  "zonas": [ { "zona": "", "piezas": [ { "pieza": "", "estado": "", "accion": "", "justificacion": "" } ] } ],
  "estructural": { "largueros": "", "travesanos": "", "torres_suspension": "", "piso": "" },
  "mecanico": { "visible": [], "probable": [] },
  "pintura": { "piezas": [], "difuminado": "", "riesgo_color": "", "complejidad": "" },
  "repuestos": { "confirmados": [], "posibles": [] },
  "operativo": { "complejidad": "", "tiempo_estimado": "", "ocupacion": "", "conviene": "" },
  "economico": { "reparar_vs_reemplazar": "", "riesgo_perdida": "", "optimizacion": "" },
  "alertas": [],
  "conclusion": "",
  "danos": [],
  "trabajos": [],
  "estimacionMin": 0,
  "estimacionMax": 0
}`

const defaultPerfil = {
  nombre: '', cuit: '', telefono: '', direccion: '', email: '',
  logo_url: '',
  costo_chapa: '', costo_pintura: '', costo_mecanica: '',
  costo_electricidad: '', costo_cristaleria: '',
  driveMode: 'B',
  driveParticulares: '', driveCompanias: '',
  companias: [
    { id: '1', nombre: 'Mapfre',  driveLink: '' },
    { id: '2', nombre: 'Zurich',  driveLink: '' },
    { id: '3', nombre: 'La Caja', driveLink: '' },
    { id: '4', nombre: 'Sancor',  driveLink: '' },
    { id: '5', nombre: 'Galeno',  driveLink: '' },
  ],
  ia_contexto: '',
  ia_rubros: { chapa: true, pintura: true, mecanica: true, electricidad: false, cristaleria: false },
  ia_rangos: { chapa_min: '', chapa_max: '', pintura_min: '', pintura_max: '', mecanica_min: '', mecanica_max: '' },
  ia_instrucciones: '',
  ia_prompt_base: PROMPT_BASE_DEFAULT,
}

export const PROMPT_BASE_DEFAULT_EXPORT = PROMPT_BASE_DEFAULT

export const useStore = create((set, get) => ({
  user: null,
  accessToken: null,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),
  signOut: () => set({ user: null, accessToken: null }),

  perfil: (() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PERFIL_KEY) || 'null')
      if (saved && !saved.ia_prompt_base) saved.ia_prompt_base = PROMPT_BASE_DEFAULT
      return saved ? { ...defaultPerfil, ...saved } : defaultPerfil
    } catch { return defaultPerfil }
  })(),
  setPerfil: (perfil) => {
    localStorage.setItem(PERFIL_KEY, JSON.stringify(perfil))
    set({ perfil })
  },

  siniestros: [],
  setSiniestros: (s) => set({ siniestros: s }),
  addSiniestro: (s) => set(state => ({ siniestros: [s, ...state.siniestros] })),
  updateSiniestro: (id, data) => set(state => ({
    siniestros: state.siniestros.map(s => s.id === id ? { ...s, ...data } : s)
  })),

  loading: false,
  setLoading: (l) => set({ loading: l }),
}))
