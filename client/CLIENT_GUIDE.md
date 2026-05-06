# Client-Side Code Guide (.NET Developer Reference)

## Overall Mental Map

| Vue / Vite concept | .NET / Blazor equivalent |
|---|---|
| `main.ts` → `createApp().mount()` | `Program.cs` → `app.Run()` |
| `App.vue` | Root layout component (`MainLayout.razor`) |
| `EmployeeList.vue` | Page component (`EmployeeList.razor`) |
| `<script setup>` | `@code { }` block in Blazor |
| `ref<T>(value)` | `[Parameter]` / `private T field` with `StateHasChanged()` |
| `onMounted(fn)` | `OnAfterRenderAsync` / `OnInitializedAsync` |
| `v-model` | `@bind` (two-way binding) |
| `v-if` / `v-else` | `@if` / `else` |
| `v-for="emp in employees"` | `@foreach (var emp in employees)` |
| `@click="fn"` | `@onclick="fn"` |
| `axios` | `HttpClient` |
| `VITE_API_URL` env var | `appsettings.json` / `IConfiguration` |
| `vite.config.ts` proxy | YARP / reverse proxy in dev |
| Vitest + `@vue/test-utils` | bUnit / xUnit for Blazor |
| `vi.mock('axios')` | Mocking `HttpMessageHandler` in tests |

---

## File-by-File Summary

| File | .NET analogy | One-line job |
|---|---|---|
| `index.html` | `wwwroot/index.html` (Blazor WASM) | Shell HTML, mounts the SPA |
| `src/main.ts` | `Program.cs` | Create Vue app, attach to DOM |
| `src/App.vue` | `MainLayout.razor` | Root layout, renders `<EmployeeList>` |
| `src/App.html` | Razor template fragment | HTML markup for `App.vue` |
| `src/App.css` | Global CSS / `app.css` | Global reset + layout styles |
| `src/types.ts` | C# record / DTO | Shared TypeScript interfaces |
| `src/components/EmployeeList.vue` | `EmployeeList.razor` (page + code-behind) | All CRUD state and logic |
| `src/components/EmployeeList.html` | Razor template fragment | HTML markup for `EmployeeList.vue` |
| `src/components/EmployeeList.css` | Scoped CSS (`EmployeeList.razor.css`) | Scoped component styles |
| `vite.config.ts` | `launchSettings.json` + proxy config | Dev server, API proxy, path aliases |
| `vitest.config.ts` | `xunit.runner.json` + test host config | Test environment, setup files |
| `src/tests/setup.ts` | `TestFixture` / `WebApplicationFactory` | Global test setup (stub `confirm`) |
| `src/tests/EmployeeList.test.ts` | `EmployeeListTests.cs` (bUnit) | Component unit tests with mocked HTTP |

---

## index.html — Shell Page (= `wwwroot/index.html`)

```html
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
```

The only HTML file. The entire UI is rendered inside `<div id="app">` by JavaScript — equivalent to Blazor WASM's `<app>` tag. `type="module"` means ES modules, not a script bundle.

---

## src/main.ts — Entry Point (= `Program.cs`)

```typescript
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

Three lines. Create a Vue application, pass in the root component, mount it into `#app`. Equivalent to:

```csharp
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
await builder.Build().RunAsync();
```

No services registered here because this project has no DI container — state lives inside components.

---

## src/types.ts — DTOs (= C# records / interfaces)

```typescript
export interface Employee {
  _id: string        // MongoDB ObjectId as string (≈ Guid in .NET)
  name: string
  phone: string
  isActive: boolean
  createdAt: string  // ISO 8601 string, not DateTime — JSON serialization
  updatedAt: string
}

export interface EmployeeForm {
  name: string
  phone: string
  isActive: boolean
}
```

`Employee` = the full server response shape (read model).  
`EmployeeForm` = the POST/PUT request body (write model / command DTO).  
The split mirrors the CQS pattern — you never send `_id`, `createdAt`, or `updatedAt` to the server.

---

## src/App.vue — Root Layout (= `MainLayout.razor`)

```vue
<template src="./App.html"></template>

<script setup lang="ts">
import EmployeeList from './components/EmployeeList.vue'
</script>

<style src="./App.css"></style>
```

A Vue SFC (Single File Component) has three sections: template, script, style. Here each section is **externalized** into its own file (`App.html`, `App.css`) for separation — the `.vue` file just wires them together.

`<script setup>` is the Composition API shorthand — everything declared inside is automatically available to the template, similar to `@code { }` in Blazor. Only one import needed: the child component.

---

## src/App.html — Root Template Markup

```html
<div id="app">
  <header class="app-header"><h1>Employee Manager</h1></header>
  <main>
    <EmployeeList />   <!-- renders the child component -->
  </main>
</div>
```

Plain HTML with one `<EmployeeList />` tag. Vue resolves this to the imported component, equivalent to `<EmployeeList />` in Razor. No logic here.

---

## src/App.css — Global Styles

CSS reset (`box-sizing`, `margin`, `padding`) plus layout for the page shell (`max-width: 960px`, centered). Applied globally — not scoped to a component.

---

## src/components/EmployeeList.vue — Main Component (= `EmployeeList.razor`)

This is the entire application. All reactive state, all API calls, all event handlers live here — no Vuex/Pinia store, no router, no services. Equivalent to a Blazor page component with `@code { }` that injects `HttpClient` directly.

### Reactive State (= Blazor `private` fields that trigger re-render)

```typescript
const employees  = ref<Employee[]>([])       // the list rendered in the table
const loading    = ref<boolean>(false)       // shows "Loading..." row
const fetchError = ref<string>('')           // error from GET/DELETE/PUT
const formError  = ref<string>('')           // error from POST

const form       = ref<EmployeeForm>({ name: '', phone: '', isActive: true })  // add form
const editForm   = ref<EmployeeForm>({ name: '', phone: '', isActive: true })  // inline edit form
const editingId  = ref<string | null>(null)  // which row is in edit mode (null = none)
```

`ref<T>()` wraps a value in a reactive container. Reading it requires `.value` in script; Vue unwraps it automatically in templates. Think of it as a `[Parameter]` or backing field that calls `StateHasChanged()` whenever it changes.

### `fetchEmployees()` — Load all (= GET action)

```typescript
async function fetchEmployees(): Promise<void> {
  loading.value = true
  fetchError.value = ''
  try {
    const { data } = await axios.get<Employee[]>(API)
    employees.value = data
  } catch {
    fetchError.value = 'Failed to load employees. Is the server running?'
  } finally {
    loading.value = false
  }
}
```

`axios.get<Employee[]>(API)` = `HttpClient.GetFromJsonAsync<List<Employee>>(url)`.  
Sets `loading` before the call, clears it in `finally` — equivalent to managing a spinner with `StateHasChanged()`.  
This function is also called after every mutation (add, edit, delete, toggle) to keep the list fresh — a simple "re-fetch everything" strategy rather than local state patching.

### `addEmployee()` — Create (= POST action)

```typescript
async function addEmployee(): Promise<void> {
  formError.value = ''
  try {
    await axios.post<Employee>(API, form.value)        // POST body = form DTO
    form.value = { name: '', phone: '', isActive: true } // reset form
    await fetchEmployees()                             // refresh list
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Failed to add employee.'
  }
}
```

`e.response?.data?.message` uses optional chaining (`?.`) — equivalent to null-conditional `?.` in C#. It safely navigates the Axios error shape to extract the server's validation message.

### `startEdit(emp)` / `cancelEdit()` — Edit mode toggle

```typescript
function startEdit(emp: Employee): void {
  editingId.value = emp._id
  editForm.value = { name: emp.name, phone: emp.phone, isActive: emp.isActive }
}

function cancelEdit(): void {
  editingId.value = null
}
```

`editingId` is the "which row is editing" flag. When it matches a row's `_id`, the template swaps that row's read view for an edit form. Equivalent to a `bool IsEditing` property per row — but here a single `string | null` covers all rows since only one can be edited at a time.

`startEdit` copies the employee's values into `editForm` — a defensive copy so the user can cancel without mutating the display data, equivalent to cloning the model before editing.

### `saveEdit(id)` — Update (= PUT action)

```typescript
async function saveEdit(id: string): Promise<void> {
  try {
    await axios.put<Employee>(`${API}/${id}`, editForm.value)
    editingId.value = null   // exit edit mode
    await fetchEmployees()
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || 'Failed to update employee.'
  }
}
```

Template literal `` `${API}/${id}` `` = C# string interpolation `$"{API}/{id}"`. After a successful save, `editingId` is cleared so the row reverts to view mode.

### `deleteEmployee(id)` — Delete (= DELETE action)

```typescript
async function deleteEmployee(id: string): Promise<void> {
  if (!confirm('Are you sure...')) return   // browser native dialog, like MessageBox
  try {
    await axios.delete(`${API}/${id}`)
    await fetchEmployees()
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || 'Failed to delete employee.'
  }
}
```

`confirm()` is the browser's built-in modal — blocks execution synchronously. Tests stub it via `vi.fn()` because happy-dom doesn't implement it (see `tests/setup.ts`).

### `toggleActive(emp)` — Toggle status (= PUT action)

```typescript
async function toggleActive(emp: Employee): Promise<void> {
  try {
    await axios.put<Employee>(`${API}/${emp._id}`, {
      name: emp.name,
      phone: emp.phone,
      isActive: !emp.isActive   // invert the boolean
    })
    await fetchEmployees()
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || 'Failed to update status.'
  }
}
```

No separate PATCH endpoint — sends the full object with only `isActive` flipped. The server's `runValidators: true` option ensures the other fields are still valid.

### `onMounted(fetchEmployees)` — Lifecycle hook

```typescript
onMounted(fetchEmployees)
```

= `protected override async Task OnAfterRenderAsync(bool firstRender)` with the `if (firstRender)` guard. Runs once after the component is inserted into the DOM — triggers the initial data load.

---

## src/components/EmployeeList.html — Template Markup

The template is split into two logical sections:

### Add Employee form (top card)

```html
<input v-model="form.name" ... />          <!-- two-way bind to form.name -->
<button @click="addEmployee" :disabled="!form.name.trim() || !form.phone.trim()">
```

- `v-model` = `@bind` — syncs input value ↔ reactive variable in both directions
- `:disabled` (colon prefix = dynamic attribute binding) = `disabled="@(!...)"` in Razor
- The button is disabled client-side when either field is empty — a UX guard, not a security measure (server validates too)

### Employee table (bottom card)

```html
<div v-if="loading">Loading...</div>

<table v-else-if="employees.length">
  <tr v-for="emp in employees" :key="emp._id">

    <!-- View mode -->
    <template v-if="editingId !== emp._id">
      <td>{{ emp.name }}</td>
      ...
    </template>

    <!-- Edit mode -->
    <template v-else>
      <td><input v-model="editForm.name" /></td>
      ...
    </template>

  </tr>
</table>

<p v-else-if="!loading">No employees yet.</p>
```

- `v-if` / `v-else-if` / `v-else` = `@if` / `else if` / `else` chain
- `v-for="emp in employees" :key="emp._id"` = `@foreach` with a stable key (like React's `key` prop) — helps the virtual DOM reconcile updates efficiently
- `{{ emp.name }}` = `@emp.Name` — interpolation
- The `<template>` tag is a logical wrapper with no DOM output, used to toggle between view and edit mode per row without wrapping `<td>` cells in an extra element

---

## src/components/EmployeeList.css — Scoped Component Styles

Declared with `<style scoped>` in the `.vue` file, meaning these class names are **only applied to this component's elements** — Vue adds a unique attribute selector automatically. Equivalent to `EmployeeList.razor.css` in Blazor which scopes styles to the component.

Key classes:
- `.card` — white rounded panel (used for both the form and the table)
- `.badge-active` / `.badge-inactive` — green/red pill for the status column
- `.btn`, `.btn-primary`, `.btn-danger`, etc. — button variants (no external CSS library)
- `.inline-input` — the input shown inside the edit-mode table cell
- `.error` — red banner for API error messages

---

## vite.config.ts — Build Tool Config (= `launchSettings.json` + YARP)

```typescript
plugins: [vue()]                      // compiles .vue files
resolve: { alias: { '@': 'src/' } }  // import '@/types' = import 'src/types'
server: {
  proxy: {
    '/api': { target: 'http://localhost:5000', changeOrigin: true }
  }
}
```

The **proxy** forwards any request starting with `/api` from the Vite dev server (port 5173) to the Express server (port 5000). This avoids CORS issues in development and means the frontend always calls `/api/employees` without hardcoding the backend port — equivalent to a reverse proxy rule in YARP or IIS URL Rewrite.

The `@` alias means `import '@/types'` resolves to `src/types.ts` — like a `using` alias or a `_Imports.razor` entry.

---

## vitest.config.ts — Test Config (= `xunit.runner.json` + test host)

```typescript
test: {
  environment: 'happy-dom',           // simulated browser DOM (≈ jsdom / playwright headless)
  globals: true,                      // describe/it/expect available without imports
  setupFiles: ['./src/tests/setup.ts'], // runs before every test file
  env: { VITE_API_URL: '/api' }       // injects env var for import.meta.env
}
```

`happy-dom` = a lightweight in-process browser simulator. It understands the DOM API so Vue can render components and you can query elements — equivalent to how bUnit renders components in-memory without a real browser.

`globals: true` makes `describe`, `it`, `expect`, `vi`, `beforeEach` etc. available globally without importing them — like `[Fact]` and `Assert` being globally available via xUnit conventions.

---

## src/tests/setup.ts — Global Test Setup (= `TestFixture` / `WebApplicationFactory`)

```typescript
if (typeof window.confirm === 'undefined') {
  Object.defineProperty(window, 'confirm', {
    writable: true, configurable: true,
    value: () => true
  })
}
```

happy-dom doesn't implement `window.confirm`. Without this stub, any test that triggers `deleteEmployee` would throw a runtime error. This is equivalent to registering a mock service in `WebApplicationFactory.ConfigureServices` — runs once before all test files via `setupFiles` in `vitest.config.ts`.

---

## src/tests/EmployeeList.test.ts — Component Tests (= bUnit / xUnit)

### Mocking Axios (= mocking `HttpMessageHandler`)

```typescript
vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)
```

`vi.mock('axios')` tells Vitest to replace the real `axios` module with auto-generated no-op mocks for every test file that imports it. `vi.mocked(axios, true)` gives you a typed reference with IntelliSense on the mock functions.

Equivalent to:
```csharp
var handlerMock = new Mock<HttpMessageHandler>();
var client = new HttpClient(handlerMock.Object);
```

### Test data factory

```typescript
const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  name: 'Jane Doe', phone: '1234567890', isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})
```

`Partial<Employee>` = `Employee` with every field optional — equivalent to C#'s `Employee? with { Name = "override" }`. The `...overrides` spread merges the caller's values over the defaults.

### Mounting and flushing

```typescript
function mountComponent() {
  return mount(EmployeeList, { attachTo: document.body })
}

const wrapper = mountComponent()
await flushPromises()   // wait for all async calls (axios, onMounted) to resolve
```

`mount()` = `RenderComponent<EmployeeList>()` in bUnit — renders the component into an in-memory DOM.  
`flushPromises()` = `await cut.InvokeAsync(...)` — advances all pending Promises (including the `onMounted` fetch) to completion before asserting.  
`attachTo: document.body` is required for focus-related assertions and is a known quirk of `@vue/test-utils`.

### Anatomy of a test

```typescript
it('posts to /api/employees and re-fetches on success', async () => {
  // 1. Arrange — set up mock return values
  mockedAxios.post.mockResolvedValue({ data: newEmp })
  mockedAxios.get
    .mockResolvedValueOnce({ data: [] })         // first call: initial load
    .mockResolvedValueOnce({ data: [newEmp] })   // second call: after add

  // 2. Act — mount, interact, wait
  const wrapper = mountComponent()
  await flushPromises()
  await wrapper.find('input[placeholder="Full Name"]').setValue('Alice')
  await wrapper.find('input[placeholder="Phone Number"]').setValue('5550001111')
  await wrapper.find('button.btn-primary').trigger('click')
  await flushPromises()

  // 3. Assert
  expect(mockedAxios.post).toHaveBeenCalledWith('/api/employees', expect.objectContaining({ name: 'Alice' }))
  expect(mockedAxios.get).toHaveBeenCalledTimes(2)
})
```

- `mockResolvedValueOnce` = "return this value for the *next* call only" — lets you sequence multiple calls
- `wrapper.find('button.btn-primary')` = CSS selector query, equivalent to `cut.Find("button.btn-primary")` in bUnit
- `.trigger('click')` = `cut.Find(...).Click()` in bUnit
- `expect.objectContaining(...)` = partial object match, equivalent to `FluentAssertions`' `.BeEquivalentTo()` with `ExcludingMissingMembers()`

### `beforeEach(() => { vi.clearAllMocks() })`

Resets all mock call counts and return values between tests — equivalent to `[SetUp]` in NUnit or the constructor pattern in xUnit. Without this, a `mockResolvedValue` set in one test would leak into the next.
