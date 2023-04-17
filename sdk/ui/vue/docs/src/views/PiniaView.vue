<template>
  <div class="pinia">
    <div class="counter">
      <t-card> 当前数量：{{ count }} </t-card>
      <t-button style="margin-top: 10px" @click="accumulate">累加</t-button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useCounterStore } from '@/store';

export default {
  setup() {
    const counterStore = useCounterStore();
    // 获取单个 state 时，需要使用 computed，否则数据不是响应式
    const count = computed(() => counterStore.count);
    const accumulate = () => counterStore.accumulate();
    return {
      /**
       * store
       */
      count,
      /**
       * methods
       */
      accumulate,
    };
  },
};
</script>

<style lang="less">
@media (min-width: 1024px) {
  .pinia {
    display: flex;
    align-items: center;
    min-height: 100vh;

    .counter {
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
