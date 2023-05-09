// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-trial',
//   templateUrl: './trial.component.html',
//   styleUrls: ['./trial.component.css']
// })
// export class TrialComponent {

// }

import { CommonModule } from '@angular/common';
import { Component, Input, ɵSafeStyle } from '@angular/core';
import useId from '../hooks/useId';
import cssClassAssembler from '../utils/cssClassAssembler';

const COMPONENT = 'sso';
const defaultProps = {
  ssoIdentifier: '',
  inputLabel: 'Tenant',
  placeholder: '',
  buttonText: 'Sign-in with SSO',
};

@Component({
  selector: 'login-trial',
  standalone: true,
  template: `
    <div [ngStyle]="styles.container" [className]="cssClassAssembler(classNames.container)">
      <ng-container *ngIf="!ssoIdentifier">
        <ng-container>
          <label
            [attr.for]="InputId"
            [ngStyle]="styles.label"
            [className]="cssClassAssembler(classNames.label)"
            >{{ inputLabel }}</label
          >
          <input
            [attr.id]="InputId"
            [value]="ssoIdentifierState"
            [attr.placeholder]="placeholder"
            (input)="handleChange($event)"
            [ngStyle]="styles.input"
            [attr.aria-invalid]="!!errMsg"
            [attr.aria-describedby]="ErrorSpanId"
            [class]="cssClassAssembler(classNames.input)" />
          <ng-container *ngIf="!!errMsg">
            <span [attr.id]="ErrorSpanId">{{ errMsg }}</span>
          </ng-container>
        </ng-container>
      </ng-container>
      <button
        type="button"
        [disabled]="!(ssoIdentifierState || ssoIdentifier) || isProcessing"
        (click)="onSubmitButton($event)"
        [ngStyle]="styles.button"
        [class]="cssClassAssembler(classNames.button)">
        {{ buttonText }}
      </button>
    </div>
  `,
  imports: [CommonModule],
  styleUrls: ['./trial.component.css'],
})
export class TrialComponent {
  cssClassAssembler = cssClassAssembler;

  // Input attribute types (aka props in React)
  // for each inner component that the Login component is made up of
  @Input() ssoIdentifier: string = defaultProps.ssoIdentifier;
  @Input() styles!: {
    container?: ɵSafeStyle;
    button?: ɵSafeStyle;
    input?: ɵSafeStyle;
    label?: ɵSafeStyle;
  };
  @Input() innerProps!: {
    input?: object;
    button?: object;
    label?: object;
    container?: object;
  };
  @Input() classNames!: {
    container?: string;
    button?: string;
    input?: string;
    label?: string;
  };
  @Input() inputLabel: string = defaultProps.inputLabel;
  @Input() placeholder: string = defaultProps.placeholder;
  @Input() buttonText: string = defaultProps.buttonText;
  @Input() onSubmit!: any;

  get InputId() {
    return useId(COMPONENT, 'input');
  }
  get ErrorSpanId() {
    return useId(COMPONENT, 'span');
  }
  ssoIdentifierState = '';
  errMsg = '';
  isProcessing = false;
  isError = !!this.errMsg;
  handleChange(e: any) {
    this.errMsg = '';
    this.ssoIdentifierState = e.currentTarget.value;
  }
  onSubmitButton(event: any) {
    void (async (e) => {
      e.preventDefault();
      this.isProcessing = true;
      const {
        error: { message },
      } = (await this.onSubmit(e)) || { error: {} };
      if (typeof message === 'string' && message) {
        console.log(message);
      }
      this.isProcessing = false;
      if (typeof message === 'string' && message) {
        this.errMsg = message;
      }
    })(event);
  }
}
