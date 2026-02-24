import app from './app.js';
import { PORT, APP_NAME } from './config.js';

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
