<script>
  import { Login } from '@boxyhq/svelte-ui';
  import Navbar from './Navbar.svelte';
  import Prism from 'prismjs';

  let presetValueCode = `<script>\n  import { Login as SSOLogin } from '@boxyhq/svelte-ui';\n  const onSSOSubmit = async (ssoIdentifier: string) => {\n    // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.\n    await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });\n  };\n< /script>\n\n<main>\n  <SSOLogin\n    buttonText={'Login with SSO'}\n    ssoIdentifier={'tenant'+tenant+'&product='+product}\n    onSubmit={onSSOSubmit}\n    classNames={{\n      container: 'mt-2',\n      button:'btn-primary btn-block btn rounded-md active:-scale-95',\n    }}\n  />;\n</main>`;
  let inputFromUserCode = `<script>\n  import { Login as SSOLogin } from '@boxyhq/svelte-ui';\n  const onSSOSubmit = async (ssoIdentifier: string) => {\n    // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.\n    await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });\n  };\n< /script>\n\n<main>\n  <SSOLogin\n    buttonText={'Login with SSO'}\n    onSubmit={onSSOSubmit}\n    classNames={{\n      container: 'mt-2',\n      label: 'text-gray-400'\n      button:'btn-primary btn-block btn rounded-md active:-scale-95',\n      input:'input-bordered input mb-5 mt-2 w-full rounded-md'\n    }}\n  />;\n</main>`;
  let stylingCode = `<main>\n  <SSOLogin\n    buttonText={'Login with SSO'}\n    onSubmit={onSSOSubmit}\n    classNames={{\n      container: 'mt-2',\n      label: 'text-gray-400'\n      button:'btn-primary btn-block btn rounded-md active:-scale-95',\n      input:'input-bordered input mb-5 mt-2 w-full rounded-md'\n    }}\n  />;\n</main>`;

  let language = 'javascript';

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
  <div class="hero-body">
    <h1 class="title">@boxyhq/svelte-ui</h1>
    <p class="description">
      UI components from <span class="boxy-link"
        ><a href="https://boxyhq.com/" target="_blank">BoxyHQ</a></span> for plug-and-play enterprise features.
    </p>
    <h1 class="installation">Installation</h1>
    <p><code class="code">npm install @boxyhq/svelte-ui --save</code></p>
    <h1 class="usage">Usage</h1>
    <h3 class="sso-login">SSO Login Component</h3>
    <p>There are mainly 2 ways of using the SSO Login Component as outlined below:</p>
    <h4 class="preset-value">Preset value for <code class="code">ssoIdentifier</code></h4>
    <p>
      If a value is passed for <code class="code">ssoIdentifier</code>, it would render a button that on click
      calls the passed-in handler (onSubmit) with the <code class="code">ssoIdentifier</code> value. The handler
      can then initiate a redirect to the SSO service forwarding the value for ssoIdentifier.
    </p>
    <div class="code-to-be-highlighted">
      <code>
        {@html Prism.highlight(presetValueCode, Prism.languages[language])}
      </code>
    </div>
    <h4 class="preset-value">Accept input from the user for <code class="code">ssoIdentifier</code></h4>
    <p>
      If a value is not passed for <code class="code">ssoIdentifier</code>, it would render an input field for
      the user to enter the <code class="code">ssoIdentifier</code> value. And then on submit, the value gets passed
      to the handler. The handler can then initiate a redirect to the SSO service forwarding the value for ssoIdentifier.
    </p>
    <div class="code-to-be-highlighted">
      <code>
        {@html Prism.highlight(inputFromUserCode, Prism.languages[language])}
      </code>
    </div>
    <h4 class="preset-value">Styling</h4>
    <p>
      If the classNames prop is passed in, we can override the default styling for each inner element. In case
      an inner element is omitted from the classNames prop, default styles will be set for the element. For
      example, In the below snippet, all the inner elements are styled by passing in the classNames for each
      inner one.
    </p>
    <div class="code-to-be-highlighted">
      <code>
        {@html Prism.highlight(stylingCode, Prism.languages[language])}
      </code>
    </div>
    <p class="ending-para">Styling via style attribute is also supported for each inner element.</p>
  </div>
</main>

<svelte:head>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.22.0/themes/prism.min.css" rel="stylesheet" />
</svelte:head>

<style>
  .hero-body {
    padding: 0 40px;
    color: #24292e;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .greet {
    background: red;
    color: white;
    padding: 10px 15px;
    margin: 20px;
  }

  .title {
    font-weight: 600;
    font-size: 32px;
    margin-top: 24px;
    margin-bottom: 16px;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
  }

  .installation,
  .usage {
    font-weight: 600;
    font-size: 24px;
    margin-top: 24px;
    margin-bottom: 16px;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
  }

  .boxy-link a {
    color: #0366d6;
    text-decoration: none;
  }

  .description {
    margin-bottom: 16px;
  }

  .code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 14.5px;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
  }

  .sso-login {
    font-size: 20px;
    margin: 24px 0 16px 0;
  }

  .preset-value {
    font-size: 16px;
    margin: 24px 0 16px 0;
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

  .code-to-be-highlighted code {
    font-size: 15px;
  }

  .ending-para {
    margin: 24px 0 36px 0;
  }
</style>
