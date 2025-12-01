export interface Notification {
  id: number;
  homeId: number;
  type: 'info' | 'alert' | 'event' | 'reminder' | 'alerta' | 'evento' | 'recordatorio' | 'recompensa' | 'informe';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}