import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AngularUiComponent } from '@boxyhq/angular-ui'

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularUiComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
