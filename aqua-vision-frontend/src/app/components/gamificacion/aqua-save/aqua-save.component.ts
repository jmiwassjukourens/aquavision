import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GamificacionService } from '../../../services/gamificacion.service';
import { FormsModule } from '@angular/forms';

interface LeakPoint {
  x: number;
  y: number;
  closed: boolean;
  dropSound?: HTMLAudioElement;
}

interface Scene {
  name: string;
  title: string;
  image: string;
  leaks: LeakPoint[];
  expense: number;
  lastRevision?: Date;
  alreadyClaimed?: boolean;
}

@Component({
  selector: 'aqua-save',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './aqua-save.component.html',
  styleUrls: ['./aqua-save.component.css']
})
export class AquaSaveComponent implements OnInit, OnDestroy {
  gameStarted = false;
  showNextScenePopup = false;

  currentIndex = 0;
  backgroundMusic!: HTMLAudioElement;
  fixSound!: HTMLAudioElement;
  drop!: HTMLAudioElement;
  hogarId: any;
  muted = false;
  volume = 50;
  showVolume = false;
  hideVolumeTimeout: any = null;

  scenes: Scene[] = [
    {
      name: 'banio',
      title: 'Baño',
      image: 'images/bathroomv2.png',
      leaks: [
        { x: 20, y: 50, closed: false },
        { x: 45, y: 42, closed: false },
        { x: 85, y: 57, closed: false },
        { x: 58, y: 16, closed: false }
      ],
      expense: 5454,
    },
    {
      name: 'lavadero',
      title: 'Lavadero',
      image: 'images/laundryv2.png',
      leaks: [
        { x: 65, y: 40, closed: false },
        { x: 46, y: 53, closed: false }
      ],
      expense: 15524,
    },
    {
      name: 'patio',
      title: 'Patio',
      image: 'images/yardv2.png',
      leaks: [
        { x: 48, y: 78, closed: false },
        { x: 31, y: 85, closed: false }
      ],
      expense: 12115,
    },
    {
      name: 'cocina',
      title: 'Cocina',
      image: 'images/kitchenv2.png',
      leaks: [
        { x: 50, y: 52, closed: false },
        { x: 69, y: 45, closed: false }
      ],
      expense: 87845,
    }
  ];

  get currentScene() {
    return this.scenes[this.currentIndex];
  }

  get closedLeaksCount() {
    return this.currentScene.leaks.filter(l => l.closed).length;
  }

    constructor(
      private gamificacionService: GamificacionService
    ){  }

  async ngOnInit() {
  this.hogarId = Number(sessionStorage.getItem('homeId'));
  this.backgroundMusic = new Audio('sounds/background-music.mp3');
  this.backgroundMusic.loop = true;
  this.backgroundMusic.volume = 0.03;

  this.drop = new Audio('sounds/gota-sound.mp3');
  this.fixSound = new Audio('sounds/fix-gota-sound.mp3');
  this.backgroundMusic.play();

  await this.checkAllScenesAlreadyClaimed(); 
  this.startGame();
  }

  ngOnDestroy() {
    this.drop.volume = 0;
    this.stopAllSounds();
  }

  startGame() {
    this.gameStarted = true;
    this.startSceneDrops();
  }

  startSceneDrops() {
    this.stopAllDropSounds();

    this.currentScene.leaks.forEach((leak, i) => {
      if (leak.closed) return;

      this.drop.loop = true;
      this.drop.volume = 0.09;
      leak.dropSound = this.drop;

      setTimeout(() => {
        if (!leak.closed) {
          this.drop.play().catch(() => {});
        }
      }, i * 1000);
    });
  }

  stopAllDropSounds() {
    this.scenes.forEach(scene => {
      scene.leaks.forEach(leak => {
        if (leak.dropSound) {
          leak.dropSound.pause();
          leak.dropSound.currentTime = 0;
          leak.dropSound.loop = false;
          leak.dropSound = undefined;
        }
      });
    });
  }

  stopAllSounds() {
    this.backgroundMusic.pause();
    this.stopAllDropSounds();
  }

closeLeak(leak: LeakPoint) {
  if (leak.closed || this.currentScene.alreadyClaimed) return; 

  leak.closed = true;

  if (leak.dropSound) {
    leak.dropSound.pause();
    leak.dropSound.currentTime = 0;
    leak.dropSound.loop = false;
    leak.dropSound = undefined;
  }

  const clickSound = new Audio('sounds/fix-gota-sound.mp3');
  clickSound.volume = 0.09;
  clickSound.play();

  const allClosed = this.currentScene.leaks.every(l => l.closed);
  if (allClosed) {
    setTimeout(() => {
      this.showNextScenePopup = true;
      this.stopAllDropSounds();
    }, 500);
  }
}

  nextScene() {
    this.showNextScenePopup = false;
    if (this.currentIndex < this.scenes.length - 1) {
      this.currentIndex++;
      this.startSceneDrops();
    } else {
      this.restartGame();
    }
  }

  restartGame() {
    this.scenes.forEach(scene =>
      scene.leaks.forEach(leak => (leak.closed = false))
    );
    this.currentIndex = 0;
    this.startSceneDrops();
  }

goToScene(index: number) {
  if (index < 0 || index >= this.scenes.length) return;

  this.currentIndex = index;
  this.startSceneDrops();
  this.showNextScenePopup = false;

  this.checkIfPointsAlreadyClaimed();
}

  getClosedLeaks(scene: Scene): number {
    return scene.leaks.filter(l => l.closed).length;
  }

allLeaksClosed(): boolean {
  return this.currentScene.leaks.every(l => l.closed);
}

claimAllPoints() {
  if (this.currentScene.alreadyClaimed || !this.allLeaksClosed()) return;
  this.currentScene.alreadyClaimed = true;

  const puntosTotales = 40;

  this.gamificacionService
    .addPuntosReclamados(this.hogarId, puntosTotales, 'AQUA_SAVE', this.currentScene.name)
    .subscribe({
      next: () => {
        console.log('Puntos reclamados correctamente');
        this.currentScene.leaks.forEach(l => l.closed = true);
        this.currentScene.lastRevision = new Date();
      },
      error: (err: any) => {
        console.error('Error al registrar puntos:', err);
        this.currentScene.alreadyClaimed = false;
      }
    });
}

checkIfPointsAlreadyClaimed() {
  const escena = this.currentScene.name;
  const minijuego = 'AQUA_SAVE';

  this.gamificacionService
    .getUltimaFechaReclamo(this.hogarId, minijuego, escena)
    .subscribe({
      next: (fecha) => {
        const yaReclamado = !!fecha;
        this.currentScene.alreadyClaimed = yaReclamado;

        if (yaReclamado) {
          this.currentScene.leaks.forEach(leak => leak.closed = true);
          this.stopAllDropSounds();

          this.currentScene.lastRevision = new Date(fecha);
        }
      },
      error: (err) => {
        if (err.status === 404) {
          this.currentScene.alreadyClaimed = false;
        } else {
          console.error('Error al verificar reclamo:', err);
        }
      }
    });
}

checkAllScenesAlreadyClaimed(): Promise<void> {
  const minijuego = 'AQUA_SAVE';

  const checks = this.scenes.map(scene =>
    new Promise<void>((resolve) => {
      this.gamificacionService
        .getUltimaFechaReclamo(this.hogarId, minijuego, scene.name)
        .subscribe({
          next: (fecha) => {
            const yaReclamado = !!fecha;
            scene.alreadyClaimed = yaReclamado;
            if (yaReclamado) {
              scene.leaks.forEach(l => l.closed = true);
              scene.lastRevision = new Date(fecha);
            }
            resolve();
          },
          error: (err) => {
            if (err.status === 404) {
              scene.alreadyClaimed = false;
            } else {
              console.error('Error al verificar reclamo:', err);
            }
            resolve();
          }
        });
    })
  );

  return Promise.all(checks).then(() => {});
}

toggleMute() {
  this.muted = !this.muted;
  this.updateVolume();
}

updateVolume() {
  const volumeLevel = this.muted ? 0 : this.volume / 100;

  if (this.backgroundMusic) this.backgroundMusic.volume = 0.03 * volumeLevel * 3;
  if (this.fixSound) this.fixSound.volume = 0.09 * volumeLevel;

  this.scenes.forEach(scene => {
    scene.leaks.forEach(leak => {
      if (leak.dropSound) leak.dropSound.volume = 0.09 * volumeLevel;
    });
  });

  clearTimeout(this.hideVolumeTimeout);
  this.hideVolumeTimeout = setTimeout(() => {
    this.showVolume = false;
  }, 3000);
}

toggleVolumeVisibility() {
  this.showVolume = true;


  clearTimeout(this.hideVolumeTimeout);
  this.hideVolumeTimeout = setTimeout(() => {
    this.showVolume = false;
  }, 3000); 
}

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.sound-control')) {
    this.showVolume = false;
  }
}

}