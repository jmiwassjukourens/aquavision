import { Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'aqua-bucket',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './aqua-bucket.component.html',
  styleUrls: ['./aqua-bucket.component.css']
})
export class AquaBucketComponent implements OnDestroy {

  @ViewChild('gameContainer', { static: true }) gameContainer!: ElementRef;

  bucketX = 150;
  bucketWidth = 60;
  drops: { x: number; y: number }[] = [];
  animationFrameId: number | null = null;
  intervalId: number | null = null;
  scoreGame = 0;
  gameStarted = false;

  startGame() {
    this.gameStarted = true;
    this.stopGame();
    this.drops = [];
    this.bucketX = 150;
    this.scoreGame = 0;

    this.intervalId = window.setInterval(() => {
      const arenaWidth = this.gameContainer?.nativeElement?.clientWidth ?? 350;
      const x = Math.random() * (arenaWidth - 30);
      this.drops.push({ x, y: 0 });
    }, 1200);

    this.gameLoop();
  }

  gameLoop() {
    const fallSpeed = 2.5;

    this.drops.forEach(drop => drop.y += fallSpeed);
    this.drops = this.drops.filter(drop => {
      const bucketTop = (this.gameContainer?.nativeElement?.clientHeight ?? 300) - 40;
      const bucketHeight = 30;
      const dropSize = 20;

      const bucketRect = { x: this.bucketX, y: bucketTop, width: this.bucketWidth, height: bucketHeight };
      const dropRect = { x: drop.x, y: drop.y, width: dropSize, height: dropSize };

      const isColliding =
        dropRect.x < bucketRect.x + bucketRect.width &&
        dropRect.x + dropRect.width > bucketRect.x &&
        dropRect.y < bucketRect.y + bucketRect.height &&
        dropRect.y + dropRect.height > bucketRect.y;

      if (isColliding) {
        this.scoreGame += 5;
        return false;
      }

      return drop.y < (this.gameContainer?.nativeElement?.clientHeight ?? 300);
    });

    this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  stopGame() {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

@HostListener('window:mousemove', ['$event'])
onMouseMove(event: MouseEvent) {
  if (!this.gameStarted || !this.gameContainer) return;

  const rect = this.gameContainer.nativeElement.getBoundingClientRect();
  const relativeX = event.clientX - rect.left;
  this.bucketX = Math.max(0, Math.min(relativeX - this.bucketWidth / 2, rect.width - this.bucketWidth));
}

  ngOnDestroy(): void {
    this.stopGame();
  }
}