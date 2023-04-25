<template>
  <div class="item">
    <i>
      <slot name="icon"></slot>
    </i>
    <div class="details">
      <h3>
        <slot name="heading"></slot>
      </h3>
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.item {
  display: flex;
  margin-top: 2rem;
}

.details {
  flex: 1;
  margin-left: 1rem;
}

i {
  display: flex;
  place-content: center;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--color-text);
}

h3 {
  margin-bottom: 0.4rem;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--color-heading);
}

@media (min-width: 1024px) {
  .item {
    padding: 0.4rem 0 1rem calc(var(--section-gap) / 2);
    margin-top: 0;
  }

  i {
    position: absolute;
    top: calc(50% - 25px);
    left: -26px;
    width: 50px;
    height: 50px;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
  }

  .item::before {
    position: absolute;
    bottom: calc(50% + 25px);
    left: 0;
    height: calc(50% - 25px);
    content: ' ';
    border-left: 1px solid var(--color-border);
  }

  .item::after {
    position: absolute;
    top: calc(50% + 25px);
    left: 0;
    height: calc(50% - 25px);
    content: ' ';
    border-left: 1px solid var(--color-border);
  }

  .item:first-of-type::before {
    display: none;
  }

  .item:last-of-type::after {
    display: none;
  }
}
</style>
