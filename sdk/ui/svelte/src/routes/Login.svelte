<script>
    import useId from "../hooks/useId";
    import cssClassAssembler from "../utils/cssClassAssembler";
    import defaultClasses from "./index.module.css";
    const COMPONENT = "sso";
  
    export let onSubmit;
    export let ssoIdentifier = "";
    export let styles;
    export let innerProps;
    export let classNames;
    export let inputLabel = "Tenant";
    export let placeholder = "";
    export let buttonText = "Sign-in with SSO";
  
    function mitosis_styling(node, vars) {
      Object.entries(vars || {}).forEach(([p, v]) => {
        if (p.startsWith("--")) {
          node.style.setProperty(p, v);
        } else {
          node.style[p] = v;
        }
      });
    }
  
    function handleChange(e) {
      errMsg = "";
      ssoIdentifierState = e.currentTarget.value;
    }
    function onSubmitButton(event) {
      void (async function (e) {
        e.preventDefault();
        isProcessing = true;
        const {
          error: { message },
        } = (await onSubmit(ssoIdentifierState || ssoIdentifier)) || {
          error: {},
        };
        isProcessing = false;
        if (typeof message === "string" && message) {
          errMsg = message;
        }
      })(event);
    }
    $: InputId = () => {
      return useId(COMPONENT, "input");
    };
    $: ErrorSpanId = () => {
      return useId(COMPONENT, "span");
    };
  
    let ssoIdentifierState = "";
    let errMsg = "";
    let isProcessing = false;
    let isError = !!errMsg;
  </script>
  
  <div
    use:mitosis_styling={{
      ...styles?.container,
    }}
    {...innerProps?.container}
    class={cssClassAssembler(classNames?.container, defaultClasses.container)}
  >
    {#if !ssoIdentifier}
      <label
        use:mitosis_styling={{
          ...styles?.label,
        }}
        for={InputId()}
        {...innerProps?.label}
        class={cssClassAssembler(classNames?.label, defaultClasses.label)}
      >
        {inputLabel}
      </label>
  
      <input
        use:mitosis_styling={{
          ...styles?.input,
        }}
        id={InputId()}
        value={ssoIdentifierState}
        {placeholder}
        on:input={(event) => {
          handleChange(event);
        }}
        aria-invalid={!!errMsg}
        aria-describedby={ErrorSpanId()}
        {...innerProps?.input}
        class={cssClassAssembler(classNames?.input, defaultClasses.input)}
      />
  
      {#if !!errMsg}
        <span id={ErrorSpanId()}>{errMsg}</span>
      {/if}
    {/if}
    <button
      use:mitosis_styling={{
        ...styles?.button,
      }}
      type="button"
      disabled={!(ssoIdentifierState || ssoIdentifier) || isProcessing}
      on:click={(event) => {
        onSubmitButton(event);
      }}
      {...innerProps?.button}
      class={cssClassAssembler(classNames?.button, defaultClasses.button)}
    >
      {buttonText}
    </button>
  </div>