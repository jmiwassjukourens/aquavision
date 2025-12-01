import { RecompensaCanjeada } from "./gamificacion";

export class Hogar {
  
    nombreHogar!: string;
    direccion!: string;
    ciudad!: string;
    tipoHogar!: string;
    cantidadBanos!: number;
    cantidadIntegrantes!: number;
    tienePatio!: boolean;
    tienePileta!: boolean;
    tieneTanquePropio!: boolean;
    tieneTermotanqueElectrico!: boolean;
    puntos!: number;

    recompensas!: RecompensaCanjeada[];
    id!: number;

}
