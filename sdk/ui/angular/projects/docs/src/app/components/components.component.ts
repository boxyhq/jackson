import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from '@boxyhq/angular-ui';
import { NavbarComponent } from '../navbar/navbar.component';
import { PrismService } from '../services/prism.services';
import Prism from 'prismjs';

@Component({
  selector: 'app-components',
  template: `
    <app-navbar></app-navbar>
    <div class="my-5 px-10">
      <div class="border-[rgba(5, 5, 5, 0.1)] border-[1px] p-10">
        <sso-login
          (onSubmit)="onSubmit()"
          [styles]="customStyles"
          [classNames]="customStyleClasses"
          [inputLabel]="'Team domain*'"
          [isProcessing]="isProcessing"
          [placeholder]="'contoso@boxyhq.com'"
          [buttonText]="'Login with SSO'"></sso-login>
        <h1 class="mb-2 mt-4 border-b-[1px] border-[#eaecef] pb-[0.5em]">Login with custom styling</h1>
        <h1 class="border-b-[1px] border-dashed border-[#eaecef] pb-[0.5em]">
          Refer the code below to see the passed props. Also supported is the passing of style attribute for
          each inner element (Note that inline style will override other styles).
        </h1>
        <button
          (click)="toggleButton(displayCustomStyle, 'displayCustomStyle')"
          class="my-[1em] rounded-md bg-[#0070f3] px-[0.7em] py-[0.5em] font-medium text-white">
          Hide code
        </button>
        <div *ngIf="displayCustomStyle">
          <pre aria-hidden="true" class="pre">
          <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{customStylingCode}}
          </code>
        </pre>
        </div>
      </div>

      <div class="border-[rgba(5, 5, 5, 0.1)] my-5 border-[1px] p-10">
        <sso-login
          [styles]="defaultStylesCode"
          [inputLabel]="'Team domain*'"
          [isProcessing]="isProcessing"
          [classNames]="{ input: 'input-custom' }"
          [placeholder]="'contoso@boxyhq.com'"
          [buttonText]="'Login with SSO'"></sso-login>
        <h1 class="mb-2 mt-4 border-b-[1px] border-[#eaecef] pb-[0.5em]">
          Login Component with default styles
        </h1>
        <h1 class="border-b-[1px] border-dashed border-[#eaecef] pb-[0.5em]">
          If classNames prop is not passed in, then default styling will be applied. Also supported is the
          passing of style attribute for each inner element (Note that inline style will override other
          styles).
        </h1>
        <button
          (click)="toggleButton(displayDeafaultStyle, 'displayDeafaultStyle')"
          class="my-[1em] rounded-md bg-[#0070f3] px-[0.7em] py-[0.5em] font-medium text-white">
          Hide code
        </button>
        <div *ngIf="displayDeafaultStyle">
          <pre aria-hidden="true" class="pre">
          <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{defaulatStylesCode}}
          </code>
        </pre>
        </div>
      </div>

      <div class="border-[rgba(5, 5, 5, 0.1)] my-5 border-[1px] p-10">
        <sso-login
          [ssoIdentifier]="'some-sso-identifier'"
          [classNames]="componentClassnames"
          [styles]="defaultStylesCode"
          [isProcessing]="isProcessing"
          [buttonText]="'SIGN IN WITH SSO'"></sso-login>
        <h1 class="mb-2 mt-4 border-b-[1px] border-[#eaecef] pb-[0.5em]">
          Login Component without input display
        </h1>
        <h1 class="border-b-[1px] border-dashed border-[#eaecef] pb-[0.5em]">
          Here we pass the ssoIdentifier directly instead of taking a user input.
        </h1>
        <button
          (click)="toggleButton(displayLoginWithouInput, 'displayLoginWithouInput')"
          class="my-[1em] rounded-md bg-[#0070f3] px-[0.7em] py-[0.5em] font-medium text-white">
          Hide code
        </button>
        <div *ngIf="displayLoginWithouInput">
          <pre aria-hidden="true" class="pre">
          <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{loginWithoutInputCode}}
          </code>
        </pre>
        </div>
      </div>

      <div class="border-[rgba(5, 5, 5, 0.1)] my-5 border-[1px] p-10">
        <sso-login
          [classNames]="componentClassnames"
          [styles]="onsubmitFailStylesCode"
          (onSubmit)="setFailing()"
          [isProcessing]="isProcessing"
          (clearInput)="clearErrorMessage()"
          [inputLabel]="'Team domain*'"
          [placeholder]="'contoso@boxyhq.com'"
          [errorMessage]="errorMessage"
          [buttonText]="'SIGN IN WITH SSO'"></sso-login>
        <h1 class="mb-2 mt-4 border-b-[1px] border-[#eaecef] pb-[0.5em]">
          Login Component with failing onSubmit
        </h1>
        <h1 class="border-b-[1px] border-dashed border-[#eaecef] pb-[0.5em]">
          If error object is returned with the error message, the message would be displayed inline.
        </h1>
        <button
          (click)="toggleButton(displayFailingOnSubmit, 'displayFailingOnSubmit')"
          class="my-[1em] rounded-md bg-[#0070f3] px-[0.7em] py-[0.5em] font-medium text-white">
          Hide code
        </button>
        <div *ngIf="displayFailingOnSubmit">
          <pre aria-hidden="true" class="pre">
          <code #codeContent [ngClass]="['code', 'language-' + codeType]">
{{failingOnSubmitCode}}
          </code>
        </pre>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, LoginComponent, NavbarComponent],
  styleUrls: ['./components.component.css'],
})
export class ComponentsComponent {
  componentStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
    },
  };

  componentClassnames = {
    container: '',
  };

  customStyleClasses = {
    button: 'btn',
    input: 'inp',
  };

  customStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: '50%',
    },
    input: {
      borderColor: '#ebedf0',
    },
    button: {
      padding: '.85rem',
      marginLeft: '0',
    },
  };

  // Try not to set error msg manually and instead set it at time of onSubmit
  errorMessage = {
    error: {
      message: null,
    },
  };

  isProcessing = false;

  defaultStylesCode = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: '50%',
    },
    input: { border: '1px solid darkcyan' },
  };

  onsubmitFailStylesCode = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      width: '50%',
    },
  };

  onSubmit = async () => {
    console.log('Button clicked');
  };

  codeType = 'javascript';
  highlighted: false;

  displayCustomStyle = true;
  displayDeafaultStyle = true;
  displayLoginWithouInput = true;
  displayFailingOnSubmit = true;

  setFailing = async () => {
    this.isProcessing = true;

    setTimeout(() => {
      //set error message
      this.errorMessage.error.message = 'Invalid team domain';
      this.isProcessing = false;
    }, 500);
  };

  clearErrorMessage = async () => {
    this.errorMessage.error.message = '';
  };

  toggleButton(propValue, propName) {
    if (propName === 'displayCustomStyle') {
      this.displayCustomStyle = !propValue;
    } else if (propName === 'displayDeafaultStyle') {
      this.displayDeafaultStyle = !propValue;
    } else if (propName === 'displayLoginWithouInput') {
      this.displayLoginWithouInput = !propValue;
    } else if (propName === 'displayFailingOnSubmit') {
      this.displayFailingOnSubmit = !propValue;
    } else {
      return;
    }
  }

  customStylingCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';
  
  @Component({
    selector: "my-component, MyComponent",
    template: '
    <sso-login
      [classNames]="componentClassnames"
      [styles]="componentStyles"
      [buttonText]="'Login with SSO'"
      [inputLabel]="'Team Domain*'"
      [placeholder]="'contoso@boxyhq.com'"
      (onSubmit)="onSubmitButton()"></sso-login>
    ',
    standalone: true,
    imports: [CommonModule, LoginComponent],
    styleUrls: ['./my-component.component.css'],
  })
  export class MyComponent{
    componentStyles = {
      input: { borderColor: '#ebedf0' },
      button: { padding: '.85rem' }
    }

    componentClassnames = {
      button:'btn',
      input: 'inp
    };
  
    async function onSubmitButton() {
      // initiate the SSO flow here
   };
  }`;

  defaulatStylesCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';
    
  @Component({
    selector: "my-component, MyComponent",
    template: '
    <sso-login
      [styles]="componentStyles"
      [inputLabel]="'Team Domain*'"
      [placeholder]="'contoso@boxyhq.com'"
      (onSubmit)="onSubmitButton()"></sso-login>
    ',
    standalone: true,
    imports: [CommonModule, LoginComponent],
    styleUrls: ['./my-component.component.css'],
  })
  export class MyComponent{
    componentStyles = {
      input: { border: '1px solid darkcyan' },
    }

    async function onSubmitButton() {
      // initiate the SSO flow here
    };
  }`;

  loginWithoutInputCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';
      
  @Component({
    selector: "my-component, MyComponent",
    template: '
      <sso-login
          [buttonText]="'SIGN IN WITH SSO'"
          [ssoIdentifier]="'some-identifier'"
          (onSubmit)="onSubmitButton()"></sso-login>
      ',
    standalone: true,
    imports: [CommonModule, LoginComponent],
    styleUrls: ['./my-component.component.css'],
  })
  export class MyComponent{
    async function onSubmitButton() {
      / initiate the SSO flow here
    };
  }`;

  failingOnSubmitCode = `import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginTrialComponent } from '@boxyhq/angular-ui';
            
  @Component({
    selector: "my-component, MyComponent",
    template: '
        <sso-login
          [buttonText]="'SIGN IN WITH SSO'"
          [ssoIdentifier]="'some-identifier'"
          (onSubmit)="onSubmitButton()"></sso-login>
        ',
    standalone: true,
    imports: [CommonModule, LoginComponent],
    styleUrls: ['./my-component.component.css'],
  })
  export class MyComponent{
    async function onSubmitButton() {
      // initiate the SSO flow here
    };
  }`;

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
