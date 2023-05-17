import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component'
import { ComponentsComponent } from './components/components.component'

const routes: Routes = [
  {
    path:'',
    component: HomeComponent,
  },
  {
    path:'components',
    component: ComponentsComponent,
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
