import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GamificacionComponent } from './gamificacion.component';
import { AquaTriviaComponent } from './aqua-trivia/aqua-trivia.component';
import { AquaBucketComponent } from './aqua-bucket/aqua-bucket.component';
import { AquaCardsComponent } from './aqua-cards/aqua-cards.component';
import { AquaMatchComponent } from './aqua-match/aqua-match.component';
import { AquaSaveComponent } from './aqua-save/aqua-save.component';


const routes: Routes = [
  { path: '', component: GamificacionComponent },
  { path: 'trivia', component: AquaTriviaComponent },
  { path: 'aqua-bucket', component: AquaBucketComponent },
  { path: 'aqua-cards', component: AquaCardsComponent },
  { path: 'aqua-match', component: AquaMatchComponent },
  { path: 'aqua-save', component: AquaSaveComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GamificationRoutingModule {}