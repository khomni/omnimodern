'use strict';

const utilities = require('./utilities');
const flat = require('flat');
const formidable = require('formidable');
const multer = require('multer');

module.exports = {
  bufferFile: multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25000000
    },
    fileFilter: function(req,file,cb){
      if(/^image/.test(file.mimetype)) return cb(null, true)
      console.log('rejecting:', file.mimetype)
      return cb(null, false)
    }
  }),

  parseMultipart: (req,res,next) => {
    let form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
      req.body = fields
      req.files = files
      return next()
    })

  },

  // restrict the following routes to logged-in users
  requireUser: (req,res,next) => {
    if(!req.user) return next(Common.error.authorization('You must be logged in to do that'))
    return next();
  },

  confirmDelete: (reaction) => {
    return (req,res,next) => {
      let route = req.baseUrl.replace(/[^a-zA-Z]+/gi,'/')
      req.session.confirmedDeletes = req.session.confirmedDeletes || {}
      if(req.body.confirm || req.session.confirmedDeletes[route]) {
        if(req.body.disable) req.session.confirmedDeletes[route] = true;
        return next();
      }
      res.locals.action = req.originalUrl;
      res.locals.body = req.body;
      return res.set('X-Modal',true).render('modals/confirmDelete',{
        action: req.originalUrl,
        body: req.body,
        reaction: reaction
      })
      // return res.redirect(req.headers.referer)
      return next();
    }
  },

  //
  requirePermission: (pathToInstance,query) => (req,res,next) => {
    if(!req.user) return next(Common.error.authorization('You must be logged in to access this resource'));
    let instance = Common.utilities.get(res.locals,pathToInstance)
    if(!instance) return next() // no instance by that name mounted

    return req.user.checkPermission(instance, query)
    .then(permission => {
      if(!permission) throw Common.error.authorization('You do not have permission to modify this resource');
      return next();
    })
    .catch(next)
  },
}

// given a req.body with a number of dot-delimited field names, converts the req.body into the corresponding object
module.exports.objectify = (req,res,next) => {
    // console.log("1:",req.body)

  return Promise.try(()=>{
    // preserve the original body, just in case
    req._body = Object.assign({},req.body);

    for(let key in req._body) {
      
      //  any keys that are empty strings should be undefined so mongoose can unset fields
      if(req.body[key] == '') req.body[key] = undefined;
      if(!Array.isArray(req.body[key]) && /\.\$\./.test(key)) req.body[key] = [req.body[key]]

      if(Array.isArray(req.body[key])) {
        req.body[key] = req.body[key]

        if(/\.\$/.test(key)) {
          req.body[key].map((value,index) => {
            req.body[key.replace('$',index)] = value
          })

          // delete the placeholder `$` key
          delete req.body[key]
        }
      }
    }
    for(var key in req.body) if(!!Number(req.body[key])) req.body[key] = Number(req.body[key])
    req.body = flat.unflatten(req.body)
    return next();
  })
  .catch(next)
}

module.exports.querify = (req,res,next) => {

  // returns converted input (recursive)
  function convert(input) {
    if(/[,;]/gi.test(input)) {
      return input.split(/[,;]/gi).map(convert)
    }

    if(input.toLowerCase() === 'true') return true
    if(input.toLowerCase() === 'false') return false

    if(input==undefined || input=='') return undefined;
    if(!isNaN(Number(input))) return Number(input)
    return input
  }

  Object.keys(req.query).forEach(key => {
    let query = req.query[key]
    req.query[key] = convert(query)
  })

  return next();
}

// if the request is a static http request, render the default index page and load the content in dynamically
module.exports.statictab = (req,res,next) => {
  if(req.isTab || req.json || req.modal) return next();
  console.log(req.originalUrl)
  return res.render('index', {href: req.originalUrl})
}
