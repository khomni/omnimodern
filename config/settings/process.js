module.exports = {
  default: {
    threads: require('os').cpus().length,
  },
  local: {
    threads: 2
  }
}
