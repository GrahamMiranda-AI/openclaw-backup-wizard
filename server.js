import 'dotenv/config.js';
import { app } from './src/app.js';
import { APP_NAME, PORT } from './src/config.js';

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
