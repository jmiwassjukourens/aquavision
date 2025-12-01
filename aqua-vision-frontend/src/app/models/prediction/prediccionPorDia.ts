export interface PrediccionPorDia {
  nombre_sector: string;
  dias: number[]; 
  consumoHistorico: number[];
  consumoActual: number[];
  consumoProyectado: number[];
  tendenciaMin: number[];
  tendenciaMax: number[];
  hallazgosClave: string[];
}