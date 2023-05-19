import { Output, EventEmitter, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import useId from './utils/useId';
import cssClassAssembler from './utils/cssClassAssembler';

const COMPONENT = 'sso';
const DEFAULT_VALUES = {
  defaultSsoIdentifier: '',
  inputLabel: 'Tenant',
  placeholder: '',
  buttonText: 'Sign-in with SSO',
};

@Component({
  selector: 'sso-login',
  template: `
    <div [ngStyle]="styles?.container" [class]="cssClassAssembler(classNames?.container)">
      <ng-container *ngIf="shouldRenderInput">
        <ng-container>
          <label
            [attr.for]="InputId"
            [ngStyle]="styles?.label"
            [class]="cssClassAssembler(classNames?.label)">
            {{ inputLabel || DEFAULT_VALUES.inputLabel }}
          </label>

          <input
            [attr.id]="InputId"
            [attr.value]="ssoIdentifierState"
            [attr.placeholder]="placeholder || DEFAULT_VALUES.placeholder"
            (input)="handleChange($event)"
            [ngStyle]="styles?.input"
            [class]="cssClassAssembler(classNames?.input)"
            [attr.aria-invalid]="isError"
            [attr.aria-describedby]="ErrorSpanId" />

          <ng-container *ngIf="isError">
            <span [attr.id]="ErrorSpanId">{{ errMsg }}</span>
          </ng-container>
        </ng-container>
      </ng-container>

      <button
        type="button"
        [disabled]="disableButton"
        (click)="onSubmitButton($event)"
        [ngStyle]="styles?.button"
        [class]="cssClassAssembler(classNames?.button)">
        {{ buttonText || DEFAULT_VALUES.buttonText }}
      </button>
    </div>
  `,
  standalone: true,
  styleUrls: ['./angular-ui.component.css'],
  imports: [CommonModule],
})
export class LoginComponent {
  DEFAULT_VALUES = DEFAULT_VALUES;
  cssClassAssembler = cssClassAssembler;

  @Input() ssoIdentifier: any;
  @Input() styles: any;
  @Input() classNames: any;
  @Input() innerProps: any;
  @Input() inputLabel: any;
  @Input() placeholder: any;
  @Input() buttonText: any;
  // Error message to be dispalyed
  // if onSubmit fails
  @Input() errorMessage: any;

  @Output() onSubmit = new EventEmitter();

  ssoIdentifierState = '';
  errMsg = '';
  isProcessing = false;
  get isError() {
    return !!this.errMsg;
  }
  get disableButton() {
    return (
      !(this.ssoIdentifierState || this.ssoIdentifier || DEFAULT_VALUES.defaultSsoIdentifier) ||
      this.isProcessing
    );
  }
  get shouldRenderInput() {
    return !(this.ssoIdentifier || DEFAULT_VALUES.defaultSsoIdentifier);
  }
  get InputId() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useId(COMPONENT, 'input');
  }
  get ErrorSpanId() {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useId(COMPONENT, 'span');
  }
  handleChange(e) {
    this.errMsg = '';
    this.ssoIdentifierState = e.currentTarget.value;
  }
  onSubmitButton(event) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;

    void (async function (e) {
      e.preventDefault();

      // void returns undefined so cant destructure as we do in react
      that.isProcessing = true;
      that.onSubmit.emit(
        that.ssoIdentifierState || that.ssoIdentifier || DEFAULT_VALUES.defaultSsoIdentifier
      );

      const {
        error: { message },
      } = that.errorMessage;
      that.isProcessing = false;
      if (typeof message === 'string' && message) {
        that.errMsg = message;
      }
    })(event);
  }
}
