import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Aceptar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      font-size: 1.4rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    mat-dialog-content {
      font-size: 15px;
      color: #555;
      padding: 8px 0 16px;
      line-height: 1.4;
    }

    mat-dialog-actions {
      padding-top: 8px;
    }

    mat-dialog-actions button {
      min-width: 90px;
      border-radius: 8px;
      font-weight: 500;
    }

    .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 16px;
    }

    :host ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      border-radius: 16px;
      padding: 16px;
    }

    :host ::ng-deep .mdc-button__label {
      text-transform: none;
    }

    button[mat-raised-button][color="warn"] {
      background-color: #d32f2f;
      color: white;
      transition: background-color 0.2s ease-in-out;
    }

    button[mat-raised-button][color="warn"]:hover {
      background-color: #b71c1c;
    }

    button[mat-button] {
      color: #555;
    }

    button[mat-button]:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string; message: string }
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
