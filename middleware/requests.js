'use strict'

// the requests middleware attaches information about the request to req.requestType

module.exports = (req, res, next) => {

  req.json = /application\/json/.test(req.get('accept'))
  req.modal = req.get('modal') == 'true'
  
  return next();
}
