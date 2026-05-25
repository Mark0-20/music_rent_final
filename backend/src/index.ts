import { connectMongo } from "./db/mongo.js";
import { env } from "./env.js";
import { app } from "./app.js";

async function main() {
  await connectMongo();
  app.listen(env.port, () => {
    console.log(`Backend en http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
