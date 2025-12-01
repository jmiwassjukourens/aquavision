export interface ReporteMensual {
  nombre_sector: string;
  mes: string; // ej: "2025-06"
  consumo_total: number;
  media_consumo: number;
  pico_maximo: number;
  costo: number;
}
