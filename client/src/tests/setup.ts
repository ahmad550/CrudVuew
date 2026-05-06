// Make import.meta.env.VITE_API_URL available in tests
Object.defineProperty(import.meta, 'env', {
  value: { VITE_API_URL: '/api' },
  writable: true
})

// happy-dom does not implement window.confirm — stub it globally
if (typeof window.confirm === 'undefined') {
  Object.defineProperty(window, 'confirm', {
    writable: true,
    configurable: true,
    value: () => true
  })
}
