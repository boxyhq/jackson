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
      :disabled="disableButton"
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

<script setup>
import { computed, ref } from "vue";

import useId from "../hooks/useId";
import cssClassAssembler from "../utils/cssClassAssembler";
import defaultClasses from "./index.module.css";
const COMPONENT = "sso";

const props = withDefaults(defineProps(), {
  ssoIdentifier: "",
  onSubmit: undefined,
  styles: undefined,
  innerProps: undefined,
  classNames: undefined,
  inputLabel: "Tenant",
  placeholder: "",
  buttonText: "Sign-in with SSO",
});
const ssoIdentifierState = ref("");
const errMsg = ref("");
const isProcessing = ref(false);
const shouldRenderInput = ref(!props.ssoIdentifier);
const isError = ref(!!errMsg.value);
const disableButton = ref(
  !(ssoIdentifierState.value || props.ssoIdentifier) || isProcessing.value
);

const InputId = computed(() => {
  return useId(COMPONENT, "input");
});
const ErrorSpanId = computed(() => {
  return useId(COMPONENT, "span");
});

function handleChange(e) {
  errMsg.value = "";
  ssoIdentifierState.value = e.currentTarget.value;
}
function onSubmitButton(event) {
  void (async function (e) {
    e.preventDefault();
    isProcessing.value = true;
    const {
      error: { message },
    } = (await props.onSubmit(ssoIdentifierState || props.ssoIdentifier)) || {
      error: {},
    };
    isProcessing.value = false;
    if (typeof message === "string" && message) {
      errMsg.value = message;
    }
  })(event);
}
function _classStringToObject(str) {
  const obj = {};
  if (typeof str !== "string") {
    return obj;
  }
  const classNames = str.trim().split(/\s+/);
  for (const name of classNames) {
    obj[name] = true;
  }
  return obj;
}
</script>