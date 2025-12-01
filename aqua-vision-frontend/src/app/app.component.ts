import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './auth/serviceAuth/auth.service'; 
import { filter } from 'rxjs';
import { GamificacionComponent } from './components/gamificacion/gamificacion.component';
import { LoaderComponent } from './utils/loader/loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet,LoaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'AquaVision';
  isMenuActive = false;
  isDesktop: boolean = window.innerWidth > 768;


  constructor(private authService: AuthService) { }
 
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  toggleMenu() {
    this.isMenuActive = !this.isMenuActive;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    const screenWidth = window.innerWidth;
    if (screenWidth > 768) {
      this.isMenuActive = false;
    }
  }

expandedIndex: number | null = null;

toggleService(index: number) {
  this.expandedIndex = this.expandedIndex === index ? null : index;
}

closeMenu() {
  if (!this.isDesktop) {
    this.isMenuActive = false;
  }
  this.expandedIndex = null;
}

@HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
if (!target.closest('.submenu')) {
  this.expandedIndex = null;
}

}

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isUser(): boolean {
    return this.authService.isUser();
  }

}
