import { Role } from "./role";

export class User{

    id!: number;
    username!: string;

    nombre!: string;
    apellido!: string;
    nombreUsuario!: string;
    correo!: string;
    correoVerificado!: boolean;
    cuentaActiva!: boolean;
    ultimoLogin!: string;

    roles!: Role[];

} 