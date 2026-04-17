export const ENV = {
  appId: process.env.APP_ID ?? "meuganho-pessoal",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
};
