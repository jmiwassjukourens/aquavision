import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../../models/question';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GamificacionService } from '../../../services/gamificacion.service';
import questionsData from '../../../utils/questions.json';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-trivia',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './aqua-trivia.component.html',
  styleUrls: ['./aqua-trivia.component.css']
})
export class AquaTriviaComponent {
  currentIndex = 0;
  score = 0;
  answered = false;
  triviaFinished = false;
  selectedIndex: number | null = null;
  hogarId: any;

  muted = false;
  volume = 50;
  showVolume = false;
  hideVolumeTimeout: any = null;

  alreadyClaimed = false;
  lastClaimDate: Date | null = null;

  backgroundMusic!: HTMLAudioElement;
  matchSound!: HTMLAudioElement;
  notMatchSound!: HTMLAudioElement;
  justificationMessage: string = '';

  questions: Question[] = [];
  dayNumber = 1;
  loading = true;
  errorLoading = false;

answerHistory: {
  question: string;
  correct: boolean;
  explanation: string;
  correctAnswer: string; 
}[] = [];

  showClaimButton = false;


  constructor(
    private http: HttpClient,
    private gamificacionService: GamificacionService
  ) {}

  ngOnInit() {
    this.hogarId = Number(sessionStorage.getItem('homeId'));
    this.determineCurrentDay();
    this.loadQuestions();
    this.setupSounds();
  }

  ngOnDestroy() {
    this.stopAllSounds();
  }

determineCurrentDay() {
  const now = new Date();
  this.dayNumber = now.getDay() === 0 ? 7 : now.getDay();  
}


loadQuestions() {
  const allQuestions = questionsData as unknown as Question[];

  this.questions = allQuestions.filter(q => q.day === this.dayNumber);

  if (this.questions.length === 0) {
    console.warn(`No hay preguntas para el día ${this.dayNumber}`);
    this.errorLoading = true;
  } else {
    this.loading = false;
    this.errorLoading = false;
  }

  console.log(
    `Preguntas cargadas para el día ${this.dayNumber}:`,
    this.questions
  );
}


  setupSounds() {
    this.backgroundMusic = new Audio('sounds/trivia-bg-music.mp3');
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.05;
    this.backgroundMusic.play().catch(() => {});

    this.matchSound = new Audio('sounds/match-sound.mp3');
    this.notMatchSound = new Audio('sounds/not-match.mp3');
    this.matchSound.volume = 0.2;
    this.notMatchSound.volume = 0.2;
  }

  stopAllSounds() {
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;
  }


checkAnswer(selectedIndex: number) {
  if (this.answered) return;
  this.answered = true;
  this.selectedIndex = selectedIndex;

  const question = this.questions[this.currentIndex];
  const correct = selectedIndex === question.correctAnswer;

  this.justificationMessage = question.explanation; 

  if (correct) {
    this.matchSound.currentTime = 0;
    this.matchSound.play().catch(() => {});
    this.score += 10;
  } else {
    this.notMatchSound.currentTime = 0;
    this.notMatchSound.play().catch(() => {});
  }

this.answerHistory.push({
  question: question.question,
  correct: correct,
  explanation: question.explanation,
  correctAnswer: question.options[question.correctAnswer]  
});
}

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.answered = false;
      this.selectedIndex = null;
    }
  }

  finishTrivia() {
  this.triviaFinished = true;

  const totalDelay = this.answerHistory.length * 350 + 500;

  setTimeout(() => {
    this.showClaimButton = true;
  }, totalDelay);
}


  toggleMute() {
    this.muted = !this.muted;
    this.updateVolume();
  }

  updateVolume() {
    const level = this.muted ? 0 : this.volume / 100;
    if (this.backgroundMusic) this.backgroundMusic.volume = 0.05 * level * 2;
    if (this.matchSound) this.matchSound.volume = 0.2 * level;
    if (this.notMatchSound) this.notMatchSound.volume = 0.2 * level;

    clearTimeout(this.hideVolumeTimeout);
    this.hideVolumeTimeout = setTimeout(() => this.showVolume = false, 3000);
  }

  toggleVolumeVisibility() {
    this.showVolume = true;
    clearTimeout(this.hideVolumeTimeout);
    this.hideVolumeTimeout = setTimeout(() => this.showVolume = false, 3000);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sound-control')) this.showVolume = false;
  }

  get dayName(): string {
  const days = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado"
  ];
  return days[new Date().getDay()];
}


claimPoints() {
  if (this.alreadyClaimed) return;

  this.alreadyClaimed = true;

  const puntosTotales = this.score;

  this.gamificacionService
    .addPuntosReclamados(this.hogarId, puntosTotales, 'TRIVIA', this.dayName)
    .subscribe({
      next: () => {
        console.log('Puntos reclamados correctamente');
      },
      error: (err: any) => {
        console.error('Error al registrar puntos:', err);
        this.alreadyClaimed = false;
      }
    });
}

}