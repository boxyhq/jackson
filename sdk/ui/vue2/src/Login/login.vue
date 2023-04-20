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
      <template v-if="!this.ssoIdentifier">
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
          :aria-invalid="!!this.errMsg"
          :aria-describedby="ErrorSpanId"
          :class="
            _classStringToObject(
              cssClassAssembler(classNames?.input, defaultClasses.input)
            )
          "
          v-bind="innerProps?.input"
        />
  
        <template v-if="!!this.errMsg">
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
      onSubmitted: { default: undefined },
      styles: { default: undefined },
      innerProps: { default: undefined },
      classNames: { default: undefined },
      inputLabel: { default: "Tenant" },
      placeholder: { default: "" },
      errorMessage: {
        type:Object,
        default: function () {
            return { error: { message: '' } }
        }
      },
      buttonText: { default: "Sign-in with SSO" },
    },
  
    data() {
      return {
        ssoIdentifierState: "",
        errMsg: "",
        isProcessing: false,
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
        void (async function (e) {
          e.preventDefault();
          that.isProcessing = true;
          (that.$emit('onSubmitted',that.ssoIdentifierState || that.ssoIdentifier));
          that.isProcessing = false;
          const errorMessageReturnedValue = that.errorMessage.error.message
          if (typeof errorMessageReturnedValue === "string" && errorMessageReturnedValue) {
            that.errMsg = errorMessageReturnedValue;
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