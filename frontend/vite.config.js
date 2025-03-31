server: {
  proxy: {
    "/api": {
      target: "https://sd-2.vercel.app",
      changeOrigin: true,
      secure: true,
    },
  },
}
