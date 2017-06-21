module.exports = {
  production: {
    name: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    forcesync: false,
    options: {
      dialect: "postgres",
      host: "localhost",
      uri: process.env.DATABASE_URL,
      logging: false,
      dialectOptions: {
        ssl: process.env.PGSSLMODE=='true'
      },
    }
  },
  test: {
    name: "test",
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    forcesync: true,
    options: {
      dialect: "postgres",
      host: "localhost",
      logging: false,
    }
  },
  default: {
    name: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    forcesync: false,
    options: {
      dialect: "postgres",
      host: "localhost",
      logging: false
        // console.log(colors.grey.apply(null, Array.prototype.slice.call(arguments).join('').match(/\b[A-Z]+\b/g)))
        // console.log(colors.grey.apply(null, Array.prototype.slice.call(arguments)))
    }
  }
}
