<script setup>
defineProps({
  modelValue: Boolean,
  items: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "click"]);
</script>

<template>
  <div class="menu">
    <Transition name="fade">
      <div
        v-show="modelValue"
        class="menu-modal"
        @click="emit('update:modelValue', false)"
      ></div>
    </Transition>
    <div v-show="modelValue" class="menu-content">
      <ul>
        <li
          v-for="(item, index) in items"
          :key="index"
          @click="
            emit('update:modelValue', false);
            emit('click', item.text);
          "
        >
          <span v-text="item.text"></span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.menu-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.menu-content {
  position: absolute;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  z-index: 2;
  border-radius: var(--radius-md);
  right: -100%;
  min-width: 140px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.menu-content li {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.12s ease;
  color: var(--text-primary);
  font-size: 12px;
}

.menu-content li:hover {
  background-color: var(--bg-hover);
}
</style>
