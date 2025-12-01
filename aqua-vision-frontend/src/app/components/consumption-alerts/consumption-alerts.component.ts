import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../services/home.service';
import { Notification } from '../../models/notification';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../utils/confirm-dialog';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-consumption-alerts',
  imports: [CommonModule],
  templateUrl: './consumption-alerts.component.html',
  styleUrl: './consumption-alerts.component.css'
})
export class ConsumptionAlertsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;
  homeId: number = 1;
  unreadCount = 0;
  deletingIds = new Set<number>();

  constructor(
    private homeService: HomeService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const hid = this.homeService.getHomeId?.() ?? 1;
    this.homeId = hid ?? 1;
    this.loadNotifications();
    this.loadUnreadCount();
  }


  private loadUnreadCount(): void {
    this.notificationService.getUnreadCount(this.homeId).subscribe({
      next: count => this.unreadCount = count,
      error: err => {
        console.error('Error cargando cantidad de no leídas', err);
        this.unreadCount = 0;
      }
    });
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

loadNotifications(): void {
  this.loading = true;

  this.notificationService.getNotifications(this.homeId).subscribe({
    next: (data: any[]) => {
      this.notifications = (data || []).map(d => ({
        id: d.id,
        homeId: this.homeId,                     
        type: d.tipo?.toLowerCase(),            
        title: d.titulo,
        message: d.mensaje,
        isRead: d.leido,
        createdAt: d.fechaEnvio ? new Date(d.fechaEnvio) : new Date(),
      }));

      this.notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      this.updateUnreadCount();
      this.loading = false;
    },
    error: err => {
      console.error('Error cargando notificaciones', err);
      this.notifications = [];
      this.updateUnreadCount();
      this.loading = false;
    }
  });
}



  markAsRead(notification: Notification): void {
    if (!notification || notification.isRead) return;

    notification.isRead = true;
    this.updateUnreadCount();

    this.notificationService.markAsRead(this.homeId,notification.id).subscribe({
      next: () => this.loadUnreadCount(),
      error: () => {
        notification.isRead = false;
        this.updateUnreadCount();
      }
    });
  }

  markAllAsRead(): void {
    if (this.notifications.length === 0) return;

    this.notifications.forEach(n => n.isRead = true);
    this.updateUnreadCount();

    this.notificationService.markAllAsRead(this.homeId).subscribe({
      next: () => this.loadUnreadCount(),
      error: () => this.loadNotifications()
    });
  }

  deleteNotification(notification: Notification): void {
    if (!notification) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar notificación', message: '¿Seguro que querés eliminar esta notificación?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.deletingIds.add(notification.id);

      this.notificationService.deleteNotification(this.homeId,notification.id).subscribe({
        next: () => {
          setTimeout(() => {
            this.notifications = this.notifications.filter(n => n.id !== notification.id);
            this.deletingIds.delete(notification.id);
            this.updateUnreadCount();
            this.loadUnreadCount(); // 🔹 refresca desde backend
          }, 360);
        },
        error: () => {
          this.deletingIds.delete(notification.id);
          this.dialog.open(ConfirmDialogComponent, {
            data: { title: 'Error', message: 'No se pudo eliminar la notificación.' }
          });
        }
      });
    });
  }

  deleteAllNotifications(): void {
    if (this.notifications.length === 0) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar todas las notificaciones', message: '¿Seguro que querés eliminar TODAS las notificaciones?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      this.notifications.forEach(n => this.deletingIds.add(n.id));

      this.notificationService.deleteAllNotifications(this.homeId).subscribe({
        next: () => {
          setTimeout(() => {
            this.notifications = [];
            this.deletingIds.clear();
            this.unreadCount = 0;
          }, 420);
        },
        error: () => {
          this.deletingIds.clear();
          this.dialog.open(ConfirmDialogComponent, {
            data: { title: 'Error', message: 'No se pudieron eliminar todas las notificaciones.' }
          });
        }
      });
    });
  }

getIcon(type: string): string {
  switch (type) {
    case 'alerta': return '⚠️';
    case 'info': return 'ℹ️';
    case 'evento': return '🎉';
    case 'recordatorio': return '⏰';
    default: return '🔔';
  }
}

getCardClass(n: Notification): string {
  const base = 'notif-card';

  if (this.deletingIds.has(n.id)) return `${base} deleting`;


  let typeClass = '';
  switch (n.type) {
    case 'alerta':
      typeClass = 'alerta-card';
      break;
    case 'recompensa':
      typeClass = 'recompensa-card';
      break;
    case 'informe':
      typeClass = 'informe-card';
      break;
    case 'evento':
      typeClass = 'evento-card';
      break;
    case 'recordatorio':
      typeClass = 'recordatorio-card';
      break;
    default:
      typeClass = 'default-card';
      break;
  }


  if (!n.isRead) {
    if (n.type === 'alerta') return `${base} ${typeClass} pulse-alert-laser`;
    if (n.type === 'evento') return `${base} ${typeClass} pulse-green`;
    return `${base} ${typeClass} pulse-soft`;
  }

  return `${base} ${typeClass}`;
}


  timeAgo(date: Date): string {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Hace un momento';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  onCardClick(n: Notification, event?: MouseEvent): void {
    const target = event?.target as HTMLElement;
    if (target && (target.closest('button') || target.tagName === 'BUTTON' || target.closest('.action-btn'))) return;
    this.markAsRead(n);
  }

  hasUnread(): boolean {
    return this.unreadCount > 0;
  }
}