import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularUiComponent } from '@boxyhq/angular-ui';
import { NavbarComponent } from '../navbar/navbar.component'

@Component({
  selector: 'app-components',
  template: `
  <app-navbar></app-navbar>

  <lib-angular-ui [styles]="componentStyles" [classNames]="componentClassnames" [inputLabel]="'Team domain*'" [buttonText]="'Login with SSO'"></lib-angular-ui>

<lib-angular-ui [ssoIdentifier]="'some-identifier'"[styles]="{
    button: {
        background: 'red'
    }
}" [classNames]="componentClassnames" [buttonText]="'Login with SSO'"></lib-angular-ui>


  <lib-angular-ui [ssoIdentifier]="'some-sso-identifier'" [classNames]="componentClassnames" [buttonText]="'LOGIN WITH SSO'"></lib-angular-ui>
  `,
  standalone: true,
  imports: [CommonModule,AngularUiComponent, NavbarComponent],
  styleUrls: ['./components.component.css']
})
export class ComponentsComponent {
  componentStyles = {
    container: {
      display:'flex',
      flexDirection: 'column'
    }
  };

  componentClassnames = {
    container: '!border-2 !border-red-500 !px-10 !py-5 !mx-10 !my-10',
  }
}
