var express = require('express');
const { model } = require('mongoose');
const { use } = require('.');
var router = express.Router();
var responseData = require('../helper/responseData');
var modelUser = require('../models/user')
var validate = require('../validates/user')
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken')
// const configs = require('../helper/configs')
var jwt = require('jsonwebtoken');
const configs = require('../helper/configs');
const { checkLogin, checkRole } = require('../middlewares/protect');
const { checkPermission } = require('../middlewares/protect');

router.post('/register', validate.validator(),
  async function (req, res, next) {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
      responseData.responseReturn(res, 400, false, errors.array().map(error => error.msg));
      return;
    }
    var user = await modelUser.getByName(req.body.userName);
    if (user) {
      responseData.responseReturn(res, 404, false, "user da ton tai");
    } else {
      const newUser = await modelUser.createUser({
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password,
      })
      responseData.responseReturn(res, 200, true, newUser);
    }
  });
router.post('/login', async function (req, res, next) {
//   if (!req.body.userName || !req.body.password) {
//     responseData.responseReturn(res, 400, true, { err: 'Hay nhap day du username va password' });
//   }
//   var user = await modelUser.getByName(req.body.userName);
//   if (!user) {
//     responseData.responseReturn(res, 400, true, { err: 'userName khong ton tai' });
//     return;
//   }
//   var result = bcrypt.compareSync(req.body.password, user.password);
//   if (!result) {
//     responseData.responseReturn(res, 400, true, { err: 'password sai' });
//   }
//   var token = jwt.sign({id: user._id }, configs.SECRET_KEY, 
//     { expiresIn: configs.EXP });
  var result = await modelUser.login(req.body.userName, req.body.password);
  if(result.err){
    responseData.responseReturn(res, 400, true, result.err);
    return;
  }
  console.log(result);
  var token = result.getJWT();
  res.cookie('tokenJWT',token);
  responseData.responseReturn(res, 200, true, token);
});

router.get('/me', async function (req, res, next) {
  var result = await checkLogin(req);
  if (result.err) {
      return responseData.responseReturn(res, 400, true, result.err);
  }

  var userRole = result.role;
  if (checkRole(userRole)) {
      var user = await modelUser.getOne(result.id);
      res.send({ "done": user });
  } else {
      responseData.responseReturn(res, 403, true, "Bạn không đủ quyền");
  }
});


module.exports = router;