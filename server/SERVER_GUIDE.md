# Server-Side Code Guide (.NET Developer Reference)

## Overall Mental Map

| Node/Express concept | .NET equivalent |
|---|---|
| `express()` app | `WebApplication` / `IApplicationBuilder` |
| `app.use(middleware)` | `app.UseMiddleware<T>()` |
| `Router` | `[ApiController]` + `[Route]` |
| Mongoose `Schema` + `model` | EF Core `DbContext` + entity class |
| `async (req, res) => {}` | `async Task<IActionResult>` action method |
| `dotenv` | `appsettings.json` + `IConfiguration` |
| `winston` | `ILogger<T>` / Serilog |
| `morgan` | `app.UseHttpLogging()` |
| Jest + Supertest | xUnit + `WebApplicationFactory<T>` |

---

## File-by-File Summary

| File | .NET analogy | One-line job |
|---|---|---|
| `index.ts` | `Program.cs` | Connect DB, start server |
| `app.ts` | `Startup.cs` | Wire middleware + routes |
| `models/Employee.ts` | EF Entity + `DbSet` | Schema, validation, DB access |
| `routes/employees.ts` | `EmployeesController` | REST handlers for CRUD |
| `logger.ts` | Serilog config | Console + file logging + HTTP access log |
| `tests/employees.test.ts` | xUnit integration tests | Full-stack HTTP tests against real MongoDB |
| `tests/setup/dbHelper.ts` | `DatabaseFixture` | Connect / truncate / drop test DB |
| `tests/setup/env.ts` | `appsettings.Testing.json` | Override `MONGO_URI` for tests |
| `tests/setup/globalSetup.ts` | `AssemblyFixture` | (empty — placeholder) |
| `tests/__mocks__/logger.ts` | Mock `ILogger<T>` | Silence real logger in tests |

---

## index.ts — Entry Point (= `Program.cs`)

```
dotenv → reads .env
mongoose.connect(MONGO_URI) → opens DB connection
  .then → app.listen(PORT)   starts HTTP server
  .catch → process.exit(1)   hard crash on bad DB
```

This is the composition root. It does **only two things**: connect to MongoDB, then start Express. The actual app configuration lives in `app.ts` (separated so tests can import the app without starting a real server — same reason you'd separate `CreateWebApplication()` from `Run()`).

---

## app.ts — App Configuration (= `Startup.cs` / middleware pipeline)

```typescript
const app = express()

app.use(cors({ origin: CLIENT_URL }))          // = app.UseCors()
app.use(express.json({ limit: '10kb' }))       // = app.UseRouting() + body parsing
app.use(httpLogger)                             // = app.UseHttpLogging()
app.use('/api/employees', employeeRoutes)       // = app.MapControllers() for /api/employees
app.use((err, _req, res, _next) => { ... })    // = global ExceptionHandler middleware
```

The 4-argument middleware `(err, req, res, next)` is Express's global error boundary — equivalent to a .NET exception-handling middleware. Any unhandled `throw` upstream lands here.

---

## models/Employee.ts — Data Model (= EF Core Entity + `DbSet<T>`)

```typescript
export interface IEmployee extends Document { ... }
```
The TypeScript interface — equivalent to your C# POCO/DTO annotated with the fields.

```typescript
const employeeSchema = new Schema<IEmployee>({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  phone:    { type: String, required: true, trim: true, maxlength: 20 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })
```

`Schema` = **Fluent API / Data Annotations** rolled into one. `timestamps: true` auto-adds `createdAt` and `updatedAt` (like `[DatabaseGenerated(DatabaseGeneratedOption.Computed)]` on both fields).

```typescript
export default mongoose.model<IEmployee>('Employee', employeeSchema)
```

`mongoose.model(...)` = **`DbSet<Employee>`**. It creates the repository object that maps to the `employees` MongoDB collection (Mongoose lowercases + pluralizes the name automatically). You import this anywhere you need DB access — no DI container needed because Node modules are singletons.

---

## routes/employees.ts — Controller (= `EmployeesController.cs`)

```typescript
const router = Router()
```
`Router` = a mini-controller. All routes defined here are prefixed by whatever path `app.ts` mounts them at (`/api/employees`).

```typescript
function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id)
}
```
MongoDB uses 24-hex-char ObjectIds instead of integer PKs. This guard is equivalent to a model-state check before hitting the DB.

### `GET /` — List all

```typescript
router.get('/', async (_req, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 })
  res.json(employees)
})
```
= `[HttpGet] Task<IActionResult> GetAll()`.
- `Employee.find()` = `_context.Employees.ToListAsync()`
- `.sort({ createdAt: -1 })` = `.OrderByDescending(e => e.CreatedAt)`

### `POST /` — Create

```typescript
const { name, phone, isActive } = req.body   // destructure = model binding
const employee = new Employee({ name, phone, isActive })
const saved = await employee.save()           // INSERT + runs schema validators
res.status(201).json(saved)
```
`employee.save()` triggers schema validation before writing. If validation fails, it throws, the `catch` returns HTTP 400. Equivalent to `[HttpPost]` + `ModelState.IsValid` check.

### `PUT /:id` — Update

```typescript
const updated = await Employee.findByIdAndUpdate(
  req.params.id,
  { name, phone, isActive },
  { new: true, runValidators: true }   // return the UPDATED doc + re-run validators
)
```
= `_context.Employees.FindAsync(id)` + mutate + `SaveChangesAsync()`.  
`new: true` is crucial — without it Mongoose returns the *old* document (pre-update), analogous to EF's default vs. `RETURNING` in SQL.

### `DELETE /:id` — Delete

```typescript
const deleted = await Employee.findByIdAndDelete(req.params.id)
if (!deleted) res.status(404).json({ message: 'Employee not found' })
```
Single atomic find-and-delete. If `null` is returned the record didn't exist → 404. Equivalent to `FindAsync` + `Remove` + `SaveChangesAsync`, but as one DB round-trip.

---

## logger.ts — Logging (= Serilog)

```typescript
const logsDir = path.join(process.cwd(), 'logs')
function ensureLogsDir() { ... fs.mkdirSync ... }
```
Creates `server/logs/` on startup if missing. The custom `Writable` stream `makeFileStream` re-checks and re-creates the directory on **every write**, so if someone deletes the folder at runtime the next log line recreates it automatically.

```typescript
export const logger = winston.createLogger({
  transports: [
    new Console({ format: consoleFormat }),                     // colored dev output
    new Stream({ stream: ...'error.log', level: 'error' }),    // errors only
    new Stream({ stream: ...'combined.log' }),                  // everything
  ]
})
```
Three sinks = three Serilog `WriteTo` calls. `level: 'error'` on the error transport means only `logger.error(...)` calls land in `error.log`.

```typescript
export const httpLogger = morgan('...', {
  stream: { write: (msg) => logger.info(msg.trim()) }
})
```
`morgan` is the HTTP access-log middleware (= `app.UseHttpLogging()`). It pipes each request line into Winston so all logs flow through a single system.

---

## tests/employees.test.ts — Integration Tests (= xUnit + `WebApplicationFactory`)

```typescript
beforeAll(async () => { await connectDB() })     // = constructor / ClassFixture setup
afterEach(async () => { await clearDB() })        // = reset between each [Fact]
afterAll(async () => { await disconnectDB() })    // = IDisposable teardown
```

`request(app)` from Supertest = `_factory.CreateClient()` from `WebApplicationFactory`. It spins up the Express app **in-process** without a real network socket — exactly how ASP.NET integration tests work.

```typescript
async function createEmployee(overrides = {}) {
  return Employee.create({ name: 'Jane Doe', phone: '1234567890', isActive: true, ...overrides })
}
```
A builder helper with defaults + spread-override — equivalent to an `ObjectMother` or `AutoFixture` customization.

Tests hit a **real MongoDB** (not mocked), matching the .NET integration-test philosophy of testing through the full stack including the DB.

---

## tests/setup/dbHelper.ts — Database Fixture (= `DatabaseFixture`)

```typescript
connectDB()    // open connection (skip if already open — readyState check)
clearDB()      // deleteMany on every collection = truncate all tables
disconnectDB() // dropDatabase + close = destroy test DB
```

---

## tests/setup/env.ts — Test Environment Config (= `appsettings.Testing.json`)

Sets `MONGO_URI` to the test database before any test file loads — equivalent to overriding `ConnectionStrings` in `appsettings.Testing.json`.

---

## tests/setup/globalSetup.ts — Assembly-level Setup (= `AssemblyFixture`)

Currently empty — placeholder for any future one-time setup that runs before the entire test suite (e.g. starting an in-process MongoDB server).

---

## tests/__mocks__/logger.ts — Logger Mock (= Mock `ILogger<T>`)

```typescript
export const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
export const httpLogger = (_req, _res, next) => next()
```

Jest automatically picks this up whenever a test imports `../logger`. It replaces the real Winston logger with no-op spies — equivalent to registering a mock `ILogger<T>` in your test DI container. `httpLogger` becomes a pass-through middleware so HTTP logs don't pollute test output.
