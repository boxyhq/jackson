import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'angular';

  inputLabel = 'Team domain*';
  identifier = 'some-state';
  buttonInput = 'Login with SSO';
  placeholder = 'contos@boxyhq.com';
  styless = {
    input: {
      //   border: '2px solid red',
      width: '150px',
      //   height: '30px',
      //  'border-radius': '35px',
      //   padding: '3px 10px',
    },
  };
  classNames = {
    button: 'bg-pink-500 text-white px-5',
  };

  loginStyles = {
    container: {
      display: 'flex',
      'flex-direction': 'column',
    },
  };
  loginClassnames = {
    container: 'flex flex-col border-2 border-red-500 m-5 px-5 py-3',
  };
  errMessage = {
    error: {
      message: 'Invalid team id',
    },
  };

  returnError = async () => this.errMessage;

  logValues = async (e: any) => {
    console.log('Button submission initiated!!!');
    console.log(e);
  };
}
