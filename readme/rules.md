# 📏 Project Rules & Guidelines

## 🏗️ Project Structure & Architecture

- Follow **MVC + Service + Repository** architecture.
- Separate responsibilities clearly:
  - Controllers → Handle requests/responses.
  - Services → Contain business logic.
  - Repositories → Database queries.
  - Models → Mongoose schemas & TypeScript interfaces.
  - Utils/Helpers → Common reusable functions.
- Use **DTOs (Data Transfer Objects)** for consistent request/response formats.
- Organize **routes modularly** per feature/domain.
- Use **repository pattern** for complex data layers.

---

## 🔐 Security & Best Practices

- Always **validate incoming data** (Joi/Zod/Yup).
- **Never hardcode secrets** → use `.env` with `dotenv`.
- Sanitize inputs to prevent **XSS/SQL injection**.
- Implement **JWT authentication**.
- Apply **RBAC (Role-Based Access Control)** if multiple roles exist.
- Enforce strong password hashing (e.g., bcrypt).

* Use **JWT** for authentication:
  - Sign tokens with a secure secret from `.env`.
  - Verify tokens in middleware for protected routes.
  - Implement refresh tokens if needed for session management.
* Use **Yup** in **validation middleware** for request payloads.

  - Validate body, query, and params consistently.

* Sanitize inputs to prevent **XSS, SQL/NoSQL injection**.
* Enforce **role-based access control (RBAC)** with middleware (Admin, Manager, Guard).
* Hash passwords securely with **bcrypt** before saving to DB.

---

## ⚡ Code Quality

- Use `ESLint` + `Prettier` for linting and formatting.
- Write **reusable middleware** (error handler, auth guard, request logger).
- Implement **centralized error handling** with custom error classes.
- Follow **Single Responsibility Principle** → keep functions small & modular.
- Write **utility functions** instead of repeating code.
- Use a **common response function** in all controllers to return API responses consistently.

* Include **Yup validation middleware** in route pipelines:

  - Example: `POST /user` → `authMiddleware` → `validateBody(YupSchema)` → `controller`.

* Ensure **all controllers use a common response function** for success/error messages.

---

## 🛠️ TypeScript

- Enable **strict mode** in `tsconfig.json`.
- Define **interfaces & types** for models, services, and responses.
- Avoid `any` → use generics or proper typing.
- Define API response types (`SuccessResponse`, `ErrorResponse`).

---

## 📦 Database Layer (MongoDB + Mongoose)

- Define **schemas with validation rules** (required, enum, min/max).
- Use **indexes** for frequent queries.
- Keep business logic **out of models** → place in services.
- Implement **soft delete** with `isDeleted: boolean`.

---

## ✅ Testing

- Write **unit tests** for services & controllers (Jest/Mocha).
- Test APIs using **Postman/Insomnia** or automated tools (Supertest).
- Use **mock DB** (mongodb-memory-server) for isolated testing.

---

## 🚀 Deployment & Maintainability

- Use **PM2 or Docker** for production.
- Implement **logging** with Winston/Morgan.
- Add **monitoring/alerts** (Sentry, ELK, etc.).
- Follow **Git branching strategy** (main/development/feature branches).
- Maintain clear **README + API documentation**.
- Use **common response function** for all APIs to standardize success/error responses.
