<script>
  import Login from './Login.svelte';

  function onSubmit() {
    console.log('SSO flow intialized');
  }
</script>

<main>
  <Login ssoIdentifier={'some-sso-identifier'} {onSubmit} />
  <h1>Welcome to SvelteKit</h1>
  <p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
  <Login
    {onSubmit}
    inputLabel={'Team domain*'}
    buttonText={'Login with SSO'}
    placeholder={'contos@boxyhq.com'} />
</main>
