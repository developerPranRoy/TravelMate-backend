import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`TravelMate API running on port ${config.port}`);
});
