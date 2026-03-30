import { PORT, APP_NAME } from './src/config.js';
import app from './src/app.js';

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on http://127.0.0.1:${PORT}`);
});
