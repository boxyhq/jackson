import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularUiComponent } from '@boxyhq/angular-ui';
import { NavbarComponent } from '../navbar/navbar.component'

@Component({
  selector: 'app-home',
  template: `
<app-navbar></app-navbar>
<div class="px-10">
      <h1
        class="mb-[16px] text-[32px] font-medium border-b-[1px] border-b-[#eaecef] pb-[0.3em]"
      >
        @boxyhq/angular-ui
      </h1>
      <p>
        UI components from
        <a href="https://boxyhq.com/" class="text-[#0366d6]" target="_blank"
          >BoxyHQ</a
        >
        for plug-and-play enterprise features.
      </p>
      <h1
        class="text-[24px] font-medium mt-6 mb-4 pb-[0.3em] border-b-[1px] border-b-[#eaecef]"
      >
        Installation
      </h1>
      <p>
        <code
          class="px-[0.2em] py-[0.4em] text-[75%] rounded-md bg-[#1B1F230D] text-[#24292E]"
          >npm install @boxyhq/angular-ui --save</code
        >
      </p>
      <h1 class="font-medium text-[24px] mt-6 mb-4 pb-[0.3em] border-b-[1px] border-b-[#eaecef]">Usage</h1>
    <h1 class="mt-6 mb-4 font-medium text-[20px]">SSO Login Component</h1>
    <p class="mt-6 mb-4 text-[16px]">There are mainly 2 ways of using the SSO Login Component as outlined below:</p>  
    <h1 class="mb-4">Preset value for<code class="px-[5.4px] py-[2.7px] font-medium rounded-md bg-[#1B1F230D] text-[#24292E]">ssoIdentifier</code></h1>
   <p class="text-[16px]">If a value is passed for <code class="px-[5.4px] text-[85%] py-[2.7px] rounded-md bg-[#1B1F230D]">ssoIdentifier</code>, it would render a button that on click calls the passed-in handler (onSubmit) with the <code class="px-[5.4px] py-[2.7px] text-[85%] rounded-md bg-[#1B1F230D]">ssoIdentifier</code> value. The handler can then initiate a redirect to the SSO service forwarding the value for ssoIdentifier.</p>
  </div>
  `,
  standalone: true,
  imports: [CommonModule,AngularUiComponent,NavbarComponent],
  styleUrls: ['./home.component.css']
})
export class HomeComponent {}
