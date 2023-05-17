import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  template: `
  <nav class="flex justify-between align-middle px-10 py-2 shadow-sm h-[65px] mb-[15px]">
    <div class="flex justify-center items-center text-[#24292E]">
      <img alt="BoxyHQ logo" src="../assets/logo.png" class="w-10 h-10"/>
      <h1 class="text-[22px] font-serif ml-2 text-[#24292E]">BoxyHQ Angular SDK</h1>
    </div>
    <div class="flex">
      <ul class="flex items-center text-[14px]">
        <li class="active:text-blue-700 active:underline"><a routerLink="/" ariaCurrentWhenActive="page" class="px-3 mx-1">SDK</a></li>
        <li class="active:text-blue-700 active:underline"><a routerLink="/components" ariaCurrentWhenActive="page" class="px-3 mx-1">Components</a></li>
      </ul>
    </div>
</nav>
  `,
  standalone: true,
  imports: [CommonModule,RouterLink,RouterLinkActive],
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

}
