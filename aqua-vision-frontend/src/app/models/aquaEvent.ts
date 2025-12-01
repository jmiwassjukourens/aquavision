import { EventTag } from "./eventTag";
import { Sector } from "./sector";

export interface AquaEvent {
  id?: number ;
  titulo: string;    
  descripcion?: string;
  fechaInicio?: Date;
  fechaFin?: Date | null;
  estado: string;
  tags: EventTag[];
  sector: Sector;         
  litrosConsumidos?: number; 
  costo?: number;           
}