export class HogarRanking {
  nombre!: string;
  puntaje_ranking!: number;
  posicion!: number;
  juego_mas_jugado!: string;
  localidad!: string;
  cantidad_sectores!: string;
}

export class RankingResponse {
  hogares!: HogarRanking[];
}

export class Recompensa {
  id!: number;
  descripcion!: string;
  puntosNecesarios!: number;
}

export class RecompensaCanjeada {
  id!: number;
  recompensa!: Recompensa;
  estado!: 'DISPONIBLE' | 'CANJEADO' | 'RECLAMADO';
  fechaCanjeo?: string;
}
