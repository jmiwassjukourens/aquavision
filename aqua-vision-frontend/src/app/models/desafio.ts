export class DesafioDetalle {
    id!: number;
    titulo!: string;
    descripcion!: string;
    puntos_recompensa!: number;    
}

export class DesafioHogarApi {
    id!: number;
    desafio!: DesafioDetalle;
    progreso!: number; // Progreso actual (es un % de 0 a 100)
    reclamado!: boolean;
}

export class HogarDesafiosResponse {
    hogarId!: number;
    desafiosHogar!: DesafioHogarApi[];
}

export class Desafio {
    idDesafioHogar!: number; 
    idDesafioGlobal!: number;
    
    titulo!: string; 
    descripcion!: string;
    
    progresoActual!: number;
    
    puntosRecompensa!: number;
    completado: boolean = false; 
    reclamado!: boolean;

    constructor(data: DesafioHogarApi) {
        this.idDesafioHogar = data.id;
        this.idDesafioGlobal = data.desafio.id;
        
        this.titulo = data.desafio.titulo;
        this.descripcion = data.desafio.descripcion;
        this.puntosRecompensa = data.desafio.puntos_recompensa;
        
        this.progresoActual = data.progreso;
        //this.progresoActual = 100;
        
        // Lógica de completado
        this.completado = this.progresoActual >= 100; 
        //this.completado = true;

        //TODO: habria que agregar del back la propiedad de completado y reclamado
        //y poder validar con el back tambien en el get si ya está reclamado
        this.reclamado = data.reclamado;
    }
}