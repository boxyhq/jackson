<script>
  import Navbar from '../Navbar.svelte';
  import { Login } from '@boxyhq/svelte-ui';

  import Prism from 'prismjs';
  let code = `console.log('Hello world')\nconst x = 90`;
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
  <h1>Welcome to the components page</h1>
  <Login inputLabel={'Team domain*'} placeholder={'contos@boxyhq.com'} onSubmit={onSubmitError} />
  <Login
    onSubmit={onSubmitButton}
    inputLabel={'Team domain*'}
    buttonText={'Login with SSO'}
    placeholder={'contos@boxyhq.com'} />
  <Login onSubmit={onSubmitButton} ssoIdentifier={'some-identifier'} />
  <div class="code">
    <code>
      {@html Prism.highlight(code, Prism.languages[language])}
    </code>
  </div>
</main>

<svelte:head>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.22.0/themes/prism.min.css" rel="stylesheet" />
</svelte:head>

<style>
  .code {
    white-space: pre-wrap;
  }
</style>
