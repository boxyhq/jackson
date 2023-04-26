<script>
  import Navbar from '../Navbar.svelte';
  import { Login } from '@boxyhq/svelte-ui';
  import Prism from 'prismjs';

  let customStylesCode = `<script>\n  import { Login } from '@boxyhq/svelte-ui';\n  import demo1 from './demo1.css?inline'\n\n  async function onSubmitButton() {\n     // initiate the SSO flow here\n  };\n< /script>\n\n<main>\n  <Login\n    onSubmit={onSubmitButton}\n    styles={{\n      input: { borderColor: '#ebedf0' },\n      button: { padding: '.85rem' },\n    }}\n    classNames={{ button: 'btn', input: 'inp' }}\n    placeholder='contoso@boxyhq.com'\n    inputLabel='Team Domain *'\n    buttonText='Login with SSO'\n    innerProps={{ input: { type: 'email' } }}\n  />;\n</main>`
  let defaultStylesCode = `<script>\n  import { Login } from '@boxyhq/svelte-ui';\n\n  async function onSubmitButton() {\n     // initiate the SSO flow here\n  };\n< /script>\n\n<main>\n  <Login\n    onSubmit={onSubmitButton}\n    styles={{ input: { border: '1px solid darkcyan' } }}\n    placeholder='contoso@boxyhq.com'\n    inputLabel='Team Domain *'\n  />;\n</main>`  
  let loginWithoutInputCode = `<script>\n  import { Login } from '@boxyhq/svelte-ui';\n\n  async function onSubmitButton() {\n     // initiate the SSO flow here\n  };\n< /script>\n\n<main>\n  <Login\n    onSubmit={onSubmitButton}\n    ssoIdentifier={'some-identifier'}\n    buttonText='SIGN IN WITH SSO'\n  />;\n</main>`  
  let loginWithFailingOnsubmitCode = `<script>\n  import { Login } from '@boxyhq/svelte-ui';\n\n  async onSubmitButton() => ({\n     error: {\n      message: 'Invalid team domain',\n     },\n  });\n< /script>\n\n<main>\n  <Login\n    onSubmit={onSubmitButton}\n    inputLabel='Team Domain *'\n    placeholder='contoso@boxyhq.com'\n  />;\n</main>`  
  
  let language = 'javascript';
  let customStylesIsActive = false;
  let defaultStylesIsActive = false;
  let withoutInputIsActive = false;
  let withFailingOnsubmitIsActive = false;
  

  function onSubmitButton() {
    console.log('SSO flow initiated');
  }

  const onSubmitError = () => ({
    error: {
      message: 'Invalid team domain',
    },
  });
</script>

<main>
  <Navbar />
  <div class='hero-body'>
    <div class="login-with-custom-styles">
      <Login styles={{
        input: { borderColor: '#ebedf0' },
        button: { padding: '.85rem' },
      }} classNames={{ button: 'btn', input: 'inp' }} onSubmit={onSubmitButton} placeholder={'contoso@boxyhq.com'} inputLabel={'Team Domain *'} buttonText={'Login with SSO'}/>
      <h2 class='custom-styles-title'>Login with custom styling</h2> 
      <h2 class='custom-styles-description'>Refer the code below to see the passed props. Also supported is the passing of style attribute for each inner element (Note that inline style will override other styles).</h2>
      <button class='btn-toggle' on:click="{() => customStylesIsActive = !customStylesIsActive}">Hide code</button>
      <div class="code-to-be-highlighted" class:active={customStylesIsActive}>
        <code>
          {@html Prism.highlight(customStylesCode, Prism.languages[language])}
        </code>     
      </div>
    </div> 
    <div class="login-with-default-styles" >
      <Login
      onSubmit={onSubmitButton}
      inputLabel={'Team domain*'}
      buttonText={'Login with SSO'}
      styles={{input: { border: '1px solid darkcyan' }}}
      placeholder={'contos@boxyhq.com'} />
      <h2 class='default-styles-title'>Login Component with default styles</h2> 
      <h2 class='default-styles-description'>If classNames prop is not passed in, then default styling will be applied. Also supported is the passing of style attribute for each inner element (Note that inline style will override other styles).</h2>
      <button class='btn-toggle' on:click="{() => defaultStylesIsActive = !defaultStylesIsActive}">Hide code</button>
      <div class="code-to-be-highlighted" class:active={defaultStylesIsActive}>
        <code>
          {@html Prism.highlight(defaultStylesCode, Prism.languages[language])}
        </code>     
      </div>
    </div>
    <div class="login-without-input">
      <Login onSubmit={onSubmitButton} ssoIdentifier={'some-identifier'} buttonText={'SIGN IN WITH SSO'} />
      <h2 class='login-without-input-title'>Login Component without input display</h2>
      <h2 class='login-without-input-title-description'>Here we pass the ssoIdentifier directly instead of taking a user input.</h2>
      <button class='btn-toggle' on:click="{() => withoutInputIsActive = !withoutInputIsActive}">Hide code</button>
      <div class="code-to-be-highlighted" class:active={withoutInputIsActive}>
        <code>
          {@html Prism.highlight(loginWithoutInputCode, Prism.languages[language])}
        </code>     
      </div>
    </div>
    <div class="login-with-failing-onsubmit">
      <Login inputLabel={'Team domain*'} placeholder={'contos@boxyhq.com'} onSubmit={onSubmitError} />
      <h2 class='login-with-failing-onsubmit-title'>Login Component with failing onSubmit</h2>
      <h2 class='login-with-failing-onsubmit-description'>If error object is returned with the error message, the message would be displayed inline.</h2>
      <button class='btn-toggle' on:click="{() => withFailingOnsubmitIsActive = !withFailingOnsubmitIsActive}">Hide code</button>
      <div class="code-to-be-highlighted" class:active={withFailingOnsubmitIsActive}>
        <code>
          {@html Prism.highlight(loginWithFailingOnsubmitCode, Prism.languages[language])}
        </code>     
      </div>
    </div>
  </div>
</main>

<svelte:head>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.22.0/themes/prism.min.css" rel="stylesheet" />
</svelte:head>

<style global>
  .code {
    white-space: pre-wrap;
  }

  .active {
    display: none;
  }

  .hero-body {
    padding: 0 40px;
    color: #24292e;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .login-with-custom-styles, .login-with-default-styles, .login-without-input, .login-with-failing-onsubmit {
    border: 1px solid rgba(5, 5, 5, 0.1);
    padding: 20px;
    margin: 15px 0;
  }

  .login-with-custom-styles h2, .login-with-default-styles h2, .login-without-input h2, .login-with-failing-onsubmit h2{
    font-size: 16px;
    font-weight: normal;
  }

  .custom-styles-title, .default-styles-title, .login-without-input-title, .login-with-failing-onsubmit-title {
    margin: 10px 0;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
  }

  .custom-styles-description, .default-styles-description, .login-without-input-title-description, .login-with-failing-onsubmit-description {
    padding-bottom: 0.4em;
    border-bottom: 1px dashed #eaecef;  
  }

  .code-to-be-highlighted {
    white-space: pre-wrap;
    color: rgb(57, 58, 52);
    background-color: rgb(246, 248, 250);
    padding: 16px;
    overflow: auto;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 3px;
  }

  .btn-toggle {
    cursor: pointer;
    margin: 0 0 1em 0;
    background: #0070f3;
    color: #fff;
    padding: 0.5rem 0.7rem;
    border-radius: 5px;
    border: 1px solid #0070f3;
    font-weight: 500;
    font-size: 1rem;
}

  :global(.btn) {
    background: #0070f3;
    color: #fff;
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 5px;
    border: 1px solid #0070f3;
    font-weight: 500;
    font-size: 1rem;
    transition: box-shadow 0.15s ease;
  }


  :global(.btn:focus-visible) {
  box-shadow: 0 0 0 1px #fff, 0 0 0 3px #0070f3;
}

:global(.btn:disabled) {
  opacity: 0.6;
  pointer-events: none;
}

:global(.inp) {
  border-radius: 5px;
  appearance: none;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #f5f5f5;
  margin-bottom: 1rem;
  outline: none;
}

:global(.inp:focus) {
  border-color: #666;
}

</style>
