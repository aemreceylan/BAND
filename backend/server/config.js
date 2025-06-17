const config = {
  server: {
    http: {
      ip: "localhost",
      port: 3000,
      status: true,
    },
    https: {
      status: false,
      privateKey: { location: "./localhost-key.pem" },
      certificate: { location: "./localhost.pem" },
    },
  },
  database: {
    url: "mongodb://localhost:27017/bandDB",
  },
  jwt: {
    secret: "abc123",
    expires: "2d",
  },
};

export default config;
