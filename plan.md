1. Update `package.json`
   - Set `"type": "module"`.
   - Update scripts: `"test": "node --test tests/app.test.js"`.
   - Add `"engines": { "node": ">=20.11.0" }`.
   - Install `supertest` as a dev dependency.
2. Refactor to ESM and Modular Architecture
   - `src/config.js`: Define environment variables, constants, and paths using `import.meta.dirname`.
   - `src/utils.js`: Move `copyRecursive`, `createBackupZip`, and `removePath` helper functions here.
   - `src/views.js`: Export `renderPage` function with native JavaScript template literals.
   - `src/app.js`: Setup Express application, multer, session, and initialize directories (`BACKUP_DIR`, `RUNTIME_DIR`, `UPLOAD_DIR`, `TMP_RESTORE_DIR`). Export `app` and `upload`.
   - `src/routes.js`: Define Express routes, statically importing `bcryptjs` and dynamically importing `upload` middleware from `app.js` as needed.
   - `server.js`: Simplify entry point to `import 'dotenv/config.js';` and start the server using `app` from `src/app.js`.
3. Update `reset-password.sh`
   - Use `node --input-type=module -e` with dynamic imports for `bcryptjs` and fallback pattern to support the project's `"type": "module"` ESM setup. Pass variables using `process.env`.
4. Create Tests (`tests/app.test.js`)
   - Write tests using `node:test` and `supertest`.
   - Setup a mock `HOME` directory with an empty `.openclaw` to prevent reading the host's actual directory.
   - Mock `process.env` before dynamically importing `app` to ensure variables are applied correctly.
5. Complete pre commit steps
   - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
6. Submit the change.
