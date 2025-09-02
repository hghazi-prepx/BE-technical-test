export const generator = {
  randomInRange(low: number, high: number) {
    low = Math.ceil(low);
    high = Math.floor(high);
    return Math.floor(Math.random() * (high - low + 1) + low);
  },
};
