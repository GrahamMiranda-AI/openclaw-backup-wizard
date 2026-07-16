1. **Update `package.json`**: Change type to `module`, update the `test` script to use `node --test tests/app.test.js`, and add `supertest` to `devDependencies`.
2. **Refactor `server.js` into modular ESM components**:
    - `src/config.js`: Extract all environment variables and constants. Update path resolutions to use `import.meta.dirname`.
    - `src/views.js`: Move the HTML templating `renderPage` function here.
    - `src/utils.js`: Move helper functions like `copyRecursive`, `createBackupZip`, and `removePath`.
    - `src/routes.js`: Move Express routes definitions here, importing required configuration and utils, and use `bcryptjs` with proper default import destructuring.
    - `src/app.js`: Handle critical directory initialization using `fs.mkdirSync` with `recursive: true`, set up Express app middleware, session, and attach the router.
    - `server.js`: Keep as the entry point, starting with `import 'dotenv/config.js';` followed by `app.listen()`.
3. **Update `reset-password.sh`**: Change to use `node --input-type=module -e` with dynamic imports for Node.js logic and pass `NEW_PASS` securely via `process.env`. Extract the default export of `bcryptjs` using `.default`.
4. **Create `tests/app.test.js`**: Write tests using `node:test` and `supertest`. Implement dynamic imports for `app.js` after setting mock `process.env` to ensure variables are applied correctly before ESM hoisting.
5. **Run tests**: Run `npm install` and `npm test` to verify changes.
6. **Pre-commit**: Complete pre-commit steps to ensure proper testing, verifications, reviews, and reflections are done.
7. **Submit**: Commit code and push changes.
