// happy-dom does not implement window.confirm — stub it globally
if (typeof window.confirm === 'undefined') {
  Object.defineProperty(window, 'confirm', {
    writable: true,
    configurable: true,
    value: () => true
  })
}
