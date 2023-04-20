<script setup>
import { Login } from '@boxyhq/vue3-ui';
</script>

<template>
  <main class="hero-body-components">
    <div class="body-components">
      <div class="login-with-custom-styles">
        <Login @onSubmit="onSubmitButton" :innerProps="{ input: { type: 'email' } }" inputLabel="Team Domain *" buttonText="Login with SSO" placeholder="contoso@boxyhq.com" :classNames="{ button: 'btn', input: 'inp'}" :styles="{ input: { borderColor: '#ebedf0' }, button: { padding: '.85rem' } }"/>
        <h2 class="hero-title">Login Component with custom styling</h2>
        <h2 class="hero-description">Refer the code below to see the passed props. Also supported is the passing of style attribute for each inner element (Note that inline style will override other styles).</h2>
        <button @click="toggleCodeSnippet('loginWithCustomStylingActive')" class="btn-toggle">Hide code</button>
        <div v-if="loginWithCustomStylingActive">
        <pre><code class="language-js">
{{ loginWithCustomStyling }}
        </code></pre>
        </div>
      </div>
      <div class="login-default-styles">
      <Login :styles="{input: { border: '1px solid darkcyan' }}" @onSubmit="onSubmitButton" inputLabel="Team domain *" placeholder="contoso@boxyhq.com" />
      <h2 class="hero-title">Login Component with default styles</h2>
      <h2 class="hero-description">If classNames prop is not passed in, then default styling will be applied. Also supported is the passing of style attribute for each inner element (Note that inline style will override other styles).</h2>
      <button @click="toggleCodeSnippet('loginDefaultStylesActive')" class="btn-toggle">Hide code</button>
      <div v-if="loginDefaultStylesActive" class="component-code">
        <pre><code class="language-js">        

{{ defaultStylesComponentCode }}
      </code></pre>
      </div>
    </div>
    <div class="login-without-input">
      <Login class="hero" ssoIdentifier="some-identifier" buttonText="SIGN IN WITH SSO" />
      <h2 class="hero-title">Login Component without input display</h2>
      <h2 class="hero-description">Here we pass the ssoIdentifier directly instead of taking a user input.</h2>
      <button @click="toggleCodeSnippet('loginWithoutInputIsActive')" class="btn-toggle">Hide code</button>
      <div v-if="loginWithoutInputIsActive">
      <pre><code class="language-js">
{{ loginWithoutInput }}  
      </code></pre></div>
    </div>
    <div class="login-with-failing-onsubmit">
      <Login @onSubmit="onSubmitButton" :errorMessage="this.errorOnSubmit" class="child" inputLabel="Team domain *" placeholder="contoso@boxyhq.com" />
      <h2 class="hero-title">Login Component with failing onSubmit</h2>
      <h2 class="hero-description">If error object is returned with the error message, the message would be displayed inline.</h2>
      <button @click="toggleCodeSnippet('loginWithFailingOnSubmitActive')" class="btn-toggle">Hide code</button>
      <div v-if="loginWithFailingOnSubmitActive">
      <pre><code class="language-js">
{{ loginWithFailingOnSubmit }}
      </code></pre>
      </div>
    </div>
    </div>
  </main>
</template>

<script>
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import 'prismjs/components/prism-jsx';

export default {
  data() {
    return {
      showCodeSnippet: true,
      loginWithoutInputIsActive: true,
      loginDefaultStylesActive: true,
      loginWithFailingOnSubmitActive: true,
      loginWithCustomStylingActive: true,
      errorOnSubmit: { error: {message: "Invalid team domain"}},
      loginWithFailingOnSubmit:"<template>\n  <Login\n    :@onSubmit='async (ssoIdentifier) => {\n        // Initiate SSO flow here\n     }',\n    :errorMessage='{ error: { message:'Invalid team domain' } }',\n    inputLabel='Team domain *',\n    placeholder='contoso@boxyhq.com',\n  /> \n</template>\n\n<script>\nimport { Login } from '@boxyhq/vue3-ui';\n\nexport default {\n  name:'Demo4'\n}\n< /script>",
      loginWithCustomStyling:"<template>\n  <Login\n    :@onSubmit='async (ssoIdentifier) => {\n       // initiate  the SSO flow here\n     }'\n    :styles='{ input: { borderColor: '#ebedf0' }, button: { padding: '.85rem' } }',\n    :classNames='{button: 'btn', input: 'inp'}'\n    inputLabel='Team domain *',\n    placeholder='contos@boxyhq.com',\n    buttonText='Login with SSO'\n    :innerProps='{input: { type: 'email' }}'\n   /> \n</template>\n\n<script>\nimport { Login } from '@boxyhq/vue3-ui';\n@import url('./demo1.css');\n\nexport default {\n  name:'Demo1'\n}\n< /script>",
      defaultStylesComponentCode:"<template>\n  <Login\n    :styles='{ input: { border: '1px solid darkcyan' } }',\n    inputLabel='Team domain *',\n    placeholder='contos@boxyhq.com',\n   /> \n</template>\n\n<script>\nimport { Login } from '@boxyhq/vue3-ui';\n\nexport default {\n  name:'Demo2'\n}\n< /script>",
      defaultStylesCode:"<Login\n      :styles='{ input: { border: '1px solid darkcyan' } }',\n      inputLabel='Team domain *',\n      placeholder='contos@boxyhq.com'\n    />",
      loginWithoutInput:"<template>\n  <Login\n    :@onSubmit='async (ssoIdentifier) => {\n       // initiate  the SSO flow here\n     }',\n    ssoIdentifier='some-identifier',\n    buttonText='SIGN IN WITH SSO',\n  /> \n</template>\n\n<script>\nimport { Login } from '@boxyhq/vue3-ui';\n\nexport default {\n  name:'Demo3'\n}\n< /script>",
    };
  },
  methods: {
    onSubmitButton() {
      console.log('Button submission initiated');
    },
    toggleCodeSnippet(propertyName) {
      this[propertyName] = !this[propertyName];
    },
    toggleButton() {
      this.showCodeSnippet = !this.showCodeSnippet;
    },
  },
  mounted() {
    Prism.highlightAll();
  },
  created() {
    this.$emit('onSubmit');
  }
};
</script>
