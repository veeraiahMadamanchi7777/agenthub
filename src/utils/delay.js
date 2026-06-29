/** Promise-based delay for mock API latency simulation. */
export function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
