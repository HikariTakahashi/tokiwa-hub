// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@kgierke/nuxt-basic-auth",
    "@nuxtjs/tailwindcss",
  ],
  basicAuth: {
    enabled: true,
    users: [
      {
        username: process.env.BASIC_AUTH_USERNAME || "",
        password: process.env.BASIC_AUTH_PASSWORD || "",
      },
    ],
  },
});
