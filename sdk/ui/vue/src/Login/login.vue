<template>
    <div
      :style="{
        ...styles?.container,
      }"
      :class="
        _classStringToObject(
          cssClassAssembler(classNames?.container, defaultClasses.container)
        )
      "
      v-bind="innerProps?.container"
    >
      <template v-if="shouldRenderInput">
        <label
          :for="InputId"
          :style="{
            ...styles?.label,
          }"
          :class="
            _classStringToObject(
              cssClassAssembler(classNames?.label, defaultClasses.label)
            )
          "
          v-bind="innerProps?.label"
        >
          {{ inputLabel }}
        </label>
        <input
          :id="InputId"
          :value="ssoIdentifierState"
          :placeholder="placeholder"
          @input="handleChange($event)"
          :style="{
            ...styles?.input,
          }"
          :aria-invalid="isError"
          :aria-describedby="ErrorSpanId"
          :class="
            _classStringToObject(
              cssClassAssembler(classNames?.input, defaultClasses.input)
            )
          "
          v-bind="innerProps?.input"
        />
  
        <template v-if="isError">
          <span :id="ErrorSpanId">{{ errMsg }}</span>
        </template>
      </template>
  
      <button
        type="button"
        :disabled="isButtonDisabled"
        @click="onSubmitButton($event)"
        :style="{
          ...styles?.button,
        }"
        :class="
          _classStringToObject(
            cssClassAssembler(classNames?.button, defaultClasses.button)
          )
        "
        v-bind="innerProps?.button"
      >
        {{ buttonText }}
      </button>
    </div>
  </template>
  
  <script>
  import useId from "../hooks/useId";
  import cssClassAssembler from "../utils/cssClassAssembler";
  import defaultClasses from "./index.module.css";
  const COMPONENT = "sso";
  
  export default {
    name: "login",
  
    props: {
      ssoIdentifier: { default: "" },
     // onSubmit:  default: undefined ,
      styles: { default: undefined },
      innerProps: { default: undefined },
      classNames: { default: undefined },
      inputLabel: { default: "Tenant" },
      placeholder: { default: "" },
      buttonText: { default: "Sign-in with SSO" },
    },
  
    data() {
      return {
        ssoIdentifierState: "",
        errMsg: "",
        isProcessing: false,
        shouldRenderInput: !this.ssoIdentifier,
        isError: !!this.errMsg,
        cssClassAssembler,
        defaultClasses,
      };
    },
  
    computed: {
      InputId() {
        return useId(COMPONENT, "input");
      },
      ErrorSpanId() {
        return useId(COMPONENT, "span");
      },
      isButtonDisabled(){
        return  !(this.ssoIdentifierState || this.ssoIdentifier) || this.isProcessing;
      }
    },
  
    methods: {
      handleChange(e) {
        this.errMsg = "";
        this.ssoIdentifierState = e.currentTarget.value;
      },
      onSubmitButton(event) {
        const that = this
       // console.log(onSubmit)
        // console.log(this)
        void (async function (e) {
          e.preventDefault();
          // console.log(this.isProcessing)
          that.isProcessing = true;
          const {
            error: { message },
          } = (that.$emit('onSubmit',that.ssoIdentifierState || that.ssoIdentifier)) || {
            error: {},
          };
          that.isProcessing = false;
          if (typeof message === "string" && message) {
            that.errMsg = message;
          }
        })(event);
      },
      _classStringToObject(str) {
        const obj = {};
        if (typeof str !== "string") {
          return obj;
        }
        const classNames = str.trim().split(/\s+/);
        for (const name of classNames) {
          obj[name] = true;
        }
        return obj;
      },
    },
  };
  </script>