import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta variable de entorno: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  mysql: {
    host: process.env.MYSQL_HOST ?? "127.0.0.1",
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: required("MYSQL_USER"),
    password: process.env.MYSQL_PASSWORD ?? "",
    database: required("MYSQL_DATABASE"),
  },
  mongoUri: required("MONGODB_URI"),
  authSecret: process.env.AUTH_SECRET ?? "music-rent-dev-secret",
};
