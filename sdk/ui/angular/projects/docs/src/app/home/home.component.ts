import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '@boxyhq/angular-ui';
import { NavbarComponent } from '../navbar/navbar.component';
import { PrismService } from '../services/prism.services';
import Prism from 'prismjs';

@Component({
  selector: 'app-home',
  template: `
    <app-navbar></app-navbar>
    <div class="px-10">
      <h1 class="mb-[16px] border-b-[1px] border-b-[#eaecef] pb-[0.3em] text-[32px] font-medium">
        @boxyhq/angular-ui
      </h1>
      <p>
        UI components from
        <a href="https://boxyhq.com/" class="text-[#0366d6]" target="_blank">BoxyHQ</a>
        for plug-and-play enterprise features.
      </p>
      <h1 class="mb-4 mt-6 border-b-[1px] border-b-[#eaecef] pb-[0.3em] text-[24px] font-medium">
        Installation
      </h1>
      <p>
        <code class="rounded-md bg-[#1B1F230D] px-[0.2em] py-[0.4em] text-[75%] text-[#24292E]"
          >npm install @boxyhq/angular-ui --save</code
        >
      </p>
      <h1 class="mb-4 mt-6 border-b-[1px] border-b-[#eaecef] pb-[0.3em] text-[24px] font-medium">Usage</h1>
      <h1 class="mb-4 mt-6 text-[20px] font-medium">SSO Login Component</h1>
      <p class="mb-4 mt-6 text-[16px]">
        There are mainly 2 ways of using the SSO Login Component as outlined below:
      </p>
      <h1 class="mb-4 font-medium">
        Preset value for<code
          class="rounded-md bg-[#1B1F230D] px-[5.4px] py-[2.7px] font-medium text-[#24292E]"
          >ssoIdentifier</code
        >
      </h1>
      <p class="mb-2 text-[16px]">
        If a value is passed for
        <code class="rounded-md bg-[#1B1F230D] px-[5.4px] py-[2.7px] text-[85%]">ssoIdentifier</code>, it
        would render a button that on click calls the passed-in handler (onSubmit) with the
        <code class="rounded-md bg-[#1B1F230D] px-[5.4px] py-[2.7px] text-[85%]">ssoIdentifier</code> value.
        The handler can then initiate a redirect to the SSO service forwarding the value for ssoIdentifier.
      </p>
      <pre aria-hidden="true" class="pre">
        <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{presetValueCode}}
        </code>
      </pre>
      <h1 class="mb-4 mt-4 font-medium">
        Accept input from the user for<code
          class="rounded-md bg-[#1B1F230D] px-[5.4px] py-[2.7px] font-medium text-[#24292E]"
          >ssoIdentifier</code
        >
      </h1>
      <p class="mb-2 text-[16px]">
        If a value is not passed for
        <code class="rounded-md bg-[#1B1F230D] px-[5.4px] py-[2.7px] text-[85%]">ssoIdentifier</code>, it
        would render an input field for the user to enter the
        <code class="rounded-md bg-[#1B1F230D] px-[5.4px] py-[2.7px] text-[85%]">ssoIdentifier</code> value.
        And then on submit, the value gets passed to the handler. The handler can then initiate a redirect to
        the SSO service forwarding the value for ssoIdentifier.
      </p>
      <pre aria-hidden="true" class="pre">
        <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{accessInputCode}}
        </code>
      </pre>
      <h1 class="mb-4 mt-4 font-medium">Styling</h1>
      <p class="mb-2 text-[16px]">
        If the classNames prop is passed in, we can override the default styling for each inner element. In
        case an inner element is omitted from the classNames prop, default styles will be set for the element.
        For example, In the below snippet, all the inner elements are styled by passing in the classNames for
        each inner one.
      </p>
      <pre aria-hidden="true" class="pre">
        <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{stylingCode}}
        </code>
      </pre>
      <p class="my-5">Styling via style attribute is also supported for each inner element.</p>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, LoginComponent, NavbarComponent],
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  language = 'javascript';

  presetValueCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';

@Component({
  selector: "my-component, MyComponent",
  template: '
  <sso-login
    [ssoIdentifier]="'tenant'+{{tenant}}+'product'+{{product}}"
    [classNames]="componentClassnames"
    [buttonText]="'Login with SSO'"
    (onSubmit)="onSubmit"></sso-login>
  ',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  styleUrls: ['./my-component.component.css'],
})
export class MyComponent{
  tenant="<your_tenant_value>"
  product="<your_product_value>"

  componentClassnames = {
    container: '!mt-2',
    button:'!btn-primary !btn-block !btn !rounded-md !active:-scale-95',
  };

  onSubmit = async (ssoIdentifier: string) => {
    // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.
    await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });
  }
}`;

  accessInputCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';
  
@Component({
  selector: "my-component, MyComponent",
  template: '
  <sso-login
    [classNames]="componentClassnames"
    [buttonText]="'Login with SSO'"
    (onSubmit)="onSubmit"></sso-login>
  ',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  styleUrls: ['./my-component.component.css'],
})
export class MyComponent{
  componentClassnames = {
    container: '!mt-2',
    label: '!text-gray-400'
    button:'!btn-primary !btn-block !btn !rounded-md !active:-scale-95',
    input:'!input-bordered !input !mb-5 !mt-2 !w-full !rounded-md'
  };
  
  onSubmit = async (ssoIdentifier: string) => {
    // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.
    await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });
  }
}`;

  stylingCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';
  
@Component({
  selector: "my-component, MyComponent",
  template: '
  <sso-login
    [classNames]="componentClassnames"
    [buttonText]="'Login with SSO'"
  ',
  standalone: true,
  imports: [CommonModule, LoginComponent],
  styleUrls: ['./my-component.component.css'],
})
export class MyComponent{
  componentClassnames = {
    container: '!mt-2',
    label: '!text-gray-400'
    button:'!btn-primary !btn-block !btn !rounded-md !active:-scale-95',
    input:'!input-bordered !input !mb-5 !mt-2 !w-full !rounded-md'
  };`;

  codeType = 'javascript';
  highlighted: false;

  constructor(private prismService: PrismService) {}

  ngAfterContentChecked() {
    Prism.highlightAll();
  }

  ngAfterViewChecked() {
    Prism.highlightAll();
  }

  ngOnDestroy() {
    Prism.highlightAll();
  }
}
