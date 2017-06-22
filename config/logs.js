'use strict';

const morgan = require('morgan');
const colors = require('colors');

module.exports = morgan((tokens, req, res) => {
  let log = []
  if(CONFIG.process.threads > 1) log.push(colors.process(`${process.pid}:`))


  let status = tokens.status(req, res)
  if(status % 500 < 100) log.push(colors.red(status))
  else if(status % 400 < 100) log.push(colors.yellow(status))
  else if(status % 300 < 100) log.push(colors.cyan(status))
  else if(status % 200 < 100) log.push(colors.green(status))
  log.push(tokens.method(req, res))

  log.push(tokens.url(req, res))

  log.push(colors.gray('–'))

  log.push(tokens.res(req, res, 'content-length'))

  log.push(colors.gray('–'))

  let responseTime = tokens['response-time'](req,res)

  if(responseTime < 50) log.push(colors.green(`${responseTime} ms`))
  else if(responseTime < 100) log.push(`${responseTime} ms`)
  else if(responseTime < 500) log.push(colors.yellow(`${responseTime} ms`))
  else log.push(colors.green(`${responseTime} ms`))

  return log.join(' ');

})
