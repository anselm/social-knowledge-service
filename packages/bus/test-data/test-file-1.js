export const testObserver = {
  meta: { title: 'dynamically loaded observer' },
  on_entity: async (blob, bus) => {
    if (blob.dynamicTest) {
      console.log('Dynamic observer received:', blob.dynamicTest);
      return { success: true, value: blob.dynamicTest };
    }
  }
};
