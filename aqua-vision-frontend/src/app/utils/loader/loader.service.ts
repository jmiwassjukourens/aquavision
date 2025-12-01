import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private pendingRequests = 0;
  private loaderSubject = new BehaviorSubject<boolean>(false);

  loader$ = this.loaderSubject.asObservable();

  show(): void {
    this.pendingRequests++;
    this.loaderSubject.next(true);
  }

hide(): void {
  if (this.pendingRequests > 0) {
    this.pendingRequests--;
  }
  if (this.pendingRequests === 0) {
      this.loaderSubject.next(false);
  }
}

}
