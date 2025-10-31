
export const testObserver2 = {
  meta: { title: 'second dynamically loaded observer' },
  on_entity: async (blob, bus) => {
    if (blob.secondTest) {
      console.log('Second dynamic observer received:', blob.secondTest);
      return { success: true, value: blob.secondTest, observer: 2 };
    }
  }
};
