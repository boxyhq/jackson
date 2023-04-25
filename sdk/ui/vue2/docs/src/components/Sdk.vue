<template>
  <div class="hero-body">
    <h1 class="welcome">@boxyhq/vue2-ui</h1>
    <p class="desciption">
      UI components from <span class="boxyhq-link"><a href="https://boxyhq.com/" target="_blank">BoxyHQ</a></span> for
      plug-and-play enterprise features.
    </p>
    <h1 class="installtion">Installation</h1>
    <p><code class="installtion-instructions">npm install @boxyhq/vue2-ui --save</code></p>
    <h2 class="usage">Usage</h2>
    <h3 class="sso-login-component">SSO Login Component</h3>
    <p class="sso-ways">There are mainly 2 ways of using the SSO Login Component as outlined below:</p>
    <h4 class="value-preset">Preset value for <code class="sso-identifier">ssoIdentifier</code></h4>
    <p>
      If a value is passed for <code class="sso-identifier-light">ssoIdentifier</code>, it would render a button that on
      click calls the passed-in handler (onSubmit) with the
      <code class="sso-identifier-light">ssoIdentifier</code> value. The handler can then initiate a redirect to the SSO
      service forwarding the value for ssoIdentifier.
    </p>
    <pre><code class="language-js prism-code">
{{ ssoPresetCode }}
    </code></pre>
    <h4 class="value-preset">Accept input from the user for <code class="sso-identifier">ssoIdentifier</code></h4>
    <p>
      If a value is not passed for <code class="sso-identifier-light">ssoIdentifier</code>, it would render an input
      field for the user to enter the <code class="sso-identifier-light">ssoIdentifier</code> value. And then on submit,
      the value gets passed to the handler. The handler can then initiate a redirect to the SSO service forwarding the
      value for ssoIdentifier.
    </p>
    <pre><code class="language-js">
{{accessInputCode}}
    </code></pre>
    <h4 class="value-preset">Styling</h4>
    <p>
      If the classNames prop is passed in, we can override the default styling for each inner element. In case an inner
      element is omitted from the classNames prop, default styles will be set for the element. For example, In the below
      snippet, all the inner elements are styled by passing in the classNames for each inner one.
    </p>
    <pre><code class="language-js">{{ stylingCode }}</code></pre>
    <p class="end-para">Styling via style attribute is also supported for each inner element.</p>
  </div>
</template>

<script>
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-jsx';

export default {
  name: 'sdk',

  props: ['greeting'],

  data() {
    return {
      ssoPresetCode:
        "<template>\n  <SSOLogin \n    buttonText='Login with SSO'\n    :ssoIdentifier=''tenant=' + {{tenant}} + '&product=' + {{product}}'\n    :onSubmit={{onSSOSubmit}}\n    :classNames='{\n      container: 'mt-2'\n      button: 'btn-primary btn-block btn rounded-md active:-scale-95',\n     }'\n  />;\n</template>\n\n<script>\n  import { Login as SSOLogin } from '@boxyhq/vue2-ui';\n\n  const onSSOSubmit = async (ssoIdentifier: string) => {\n     // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.\n     await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });\n  };\n< /script>",
      accessInputCode:
        "<template>\n  <SSOLogin \n    buttonText='Login with SSO'\n    onSubmit={{onSSOSubmit}}\n    :classNames='{\n      container: 'mt-2',\n      label: 'text-gray-400',\n      button: 'btn-primary btn-block btn rounded-md active:-scale-95',\n      input: 'input-bordered input mb-5 mt-2 w-full rounded-md',\n    }'\n  />;\n</template>\n\n<script>\n  import { Login as SSOLogin } from '@boxyhq/vue2-ui';\n\n  const onSSOSubmit = async (ssoIdentifier: string) => {\n  // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.\n  await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });\n  };\n< /script>",
      stylingCode:
        "<template>\n  <SSOLogin\n    buttonText='Login with SSO'\n    onSubmit={{onSSOSubmit}}\n    :classNames='{\n    container: 'mt-2',\n    label: 'text-gray-400',\n    button: 'btn-primary btn-block btn rounded-md active:-scale-95',\n    input: 'input-bordered input mb-5 mt-2 w-full rounded-md'\n  }'\n</template>/>\n\n<script>\n  import { Login } from '@boxyhq/vue2-ui';\n< /script>",
    };
  },

  mounted() {
    Prism.highlightAll();
    console.log('This is trigerring a component mount');
  },
  updated() {
    Prism.highlightAll();
    console.log('Component update successfully');
  },
};
</script>

<style scoped></style>
