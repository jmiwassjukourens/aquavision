import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GamificacionService } from '../../../services/gamificacion.service';
import { FormsModule } from '@angular/forms';

interface Card {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
}

@Component({
  selector: 'aqua-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './aqua-cards.component.html',
  styleUrls: ['./aqua-cards.component.css']
})
export class AquaCardsComponent implements OnInit, OnDestroy {
  icons = ['🚿', '🚽', '🚰', '💧', '🧺', '🌊'];
  cards: Card[] = [];
  flippedCards: Card[] = [];
  matchedCards: string[] = [];
  scoreCards = 0;

  timeLeft = 60;
  timerInterval: any;
  gameStarted = false;

  hogarId: any;
  backgroundMusic!: HTMLAudioElement;
  matchSound!: HTMLAudioElement;
  notMatchSound!: HTMLAudioElement;

  volume = 50;
  muted = false;
  showVolume = false;
  hideVolumeTimeout: any = null;
  lastClaimDate: Date | null = null;
  alreadyClaimed = false;

  infoTexts: { [key: string]: { title: string, detail: string, claimed: boolean, matched: boolean } } = {
    '🚿': {
      title: 'Ducha eficiente',
      detail: 'Una ducha de 10 minutos consume unos 200 litros de agua. Si la reducís a 5 minutos, podés ahorrar lo suficiente para llenar 2 baldes de agua limpia. ¡Cada minuto cuenta!',
      claimed: false,
      matched: false
    },
    '🚽': {
      title: 'Uso del inodoro',
      detail: 'Cada descarga usa entre 6 y 12 litros. Un inodoro eficiente podría ahorrar más de 40 litros al día por persona.',
      claimed: false,
      matched: false
    },
    '🚰': {
      title: 'Grifo abierto',
      detail: 'Dejar el grifo abierto mientras te cepillás los dientes desperdicia hasta 20 litros por minuto. Cerrarlo mientras tanto ahorra agua para lavar los platos de todo un almuerzo.',
      claimed: false,
      matched: false
    },
    '💧': {
      title: 'Gota a gota',
      detail: 'Un grifo que gotea pierde 30 litros diarios. En un mes, eso equivale a más de 900 litros: suficiente para llenar una bañera grande.',
      claimed: false,
      matched: false
    },
    '🧺': {
      title: 'Lavado inteligente',
      detail: 'Lavar la ropa con carga completa puede ahorrar hasta 50 litros por lavado, además de energía. Usá programas cortos si la ropa no está muy sucia.',
      claimed: false,
      matched: false
    },
    '🌊': {
      title: 'Conciencia del recurso',
      detail: 'El agua dulce disponible representa menos del 1% del total del agua del planeta. Cada gota ahorrada ayuda a preservar un recurso limitado.',
      claimed: false,
      matched: false
    }
  };

  constructor(private gamificacionService: GamificacionService) {}

  ngOnInit() {
    this.hogarId = Number(sessionStorage.getItem('homeId'));
    this.checkIfPointsAlreadyClaimed();
    this.resetMemory();
    this.setupSounds();
  }

  ngOnDestroy() {
    this.stopAllSounds();
  }

  setupSounds() {
    this.backgroundMusic = new Audio('sounds/aqua-match-bg.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.05;
    this.backgroundMusic.play().catch(() => {});

    this.matchSound = new Audio('sounds/match-sound.mp3');
    this.notMatchSound = new Audio('sounds/not-match.mp3');
    this.matchSound.volume = 0.2;
    this.notMatchSound.volume = 0.2;
  }

  startGame() {
    this.gameStarted = true;
  }

  resetMemory() {
    this.cards = [...this.icons, ...this.icons]
      .map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
      .sort(() => Math.random() - 0.5);

    this.flippedCards = [];
    this.matchedCards = [];
    this.scoreCards = 0;

    Object.values(this.infoTexts).forEach(info => {
      info.claimed = false;
      info.matched = false;
    });

    this.gameStarted = false;
  }

  flipCard(card: Card) {
    if (!this.gameStarted || this.flippedCards.length >= 2 || card.flipped || card.matched) return;

    card.flipped = true;
    this.flippedCards.push(card);

    if (this.flippedCards.length === 2) {
      setTimeout(() => {
        const [first, second] = this.flippedCards;
        if (first.icon === second.icon) {
          this.matchSound.currentTime = 0;
          this.matchSound.play().catch(() => {});
          this.flippedCards.forEach(c => c.matched = true);
          this.matchedCards.push(card.icon);
          this.infoTexts[card.icon].matched = true;
        } else {
          this.notMatchSound.currentTime = 0;
          this.notMatchSound.play().catch(() => {});
          this.flippedCards.forEach(c => c.flipped = false);
        }
        this.flippedCards = [];
      }, 800);
    }
  }

  markAsRead(icon: string) {
    const info = this.infoTexts[icon];
    if (!info.claimed) {
      info.claimed = true;
      this.scoreCards += 10;
    }
  }

  allRead(): boolean {
    return Object.values(this.infoTexts).every(info => info.claimed);
  }

  get remainingMatches(): number {
    const totalPairs = this.icons.length;
    const matchedPairs = this.matchedCards.length;
    return totalPairs - matchedPairs;
  }

  stopAllSounds() {
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
  }

  updateVolume() {
    const level = this.muted ? 0 : this.volume / 100;
    if (this.backgroundMusic) this.backgroundMusic.volume = 0.05 * level * 2;
    if (this.matchSound) this.matchSound.volume = 0.2 * level;
    if (this.notMatchSound) this.notMatchSound.volume = 0.2 * level;

    clearTimeout(this.hideVolumeTimeout);
    this.hideVolumeTimeout = setTimeout(() => {
      this.showVolume = false;
    }, 3000);
  }

  toggleMute() {
    this.muted = !this.muted;
    this.updateVolume();
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

    claimAllPoints() {
    if (this.alreadyClaimed || !this.allRead()) return;

    const puntosTotales = 40;
    const minijuego = 'AQUA_CARDS';
    const escena = 'CARDS';

    this.gamificacionService
      .addPuntosReclamados(this.hogarId, puntosTotales, minijuego, escena)
      .subscribe({
        next: () => {
          this.alreadyClaimed = true;
          this.lastClaimDate = new Date();
          console.log('Puntos reclamados correctamente');
        },
        error: (err: any) => {
          console.error('Error al reclamar puntos:', err);
        }
      });
  }

  checkIfPointsAlreadyClaimed() {
    const minijuego = 'AQUA_CARDS';
    const escena = 'CARDS';

    this.gamificacionService
      .getUltimaFechaReclamo(this.hogarId, minijuego, escena)
      .subscribe({
        next: (fecha) => {
          const yaReclamado = !!fecha;
          this.alreadyClaimed = yaReclamado;

          if (yaReclamado) {
            this.lastClaimDate = new Date(fecha);
          }
        },
        error: (err) => {
          if (err.status === 404) {
            this.alreadyClaimed = false;
          } else {
            console.error('Error al verificar reclamo:', err);
          }
        }
      });
  }
}