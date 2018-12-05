const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const User = require('../models/user');

router.post('/', function (req,res,next) {
    const {username,password}= req.body;
    let {fullname}= req.body;

    //BEGIN VALIDATION - Go over the code here to understand it better
    //Rewrite it in my own words or code.
    const requiredFields = ['username', 'password'];
    const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
          .min} characters long`
        : `Must be at most ${sizedFields[tooLargeField]
          .max} characters long`,
      location: tooSmallField || tooLargeField
    });
  }


  //// VALIDATION END


  //Trim the fullname
  if(fullname){
    fullname = fullname.trim();
  }
  //
    
    return User.hashPassword(password)
    .then(disgest => {
        const newUser ={
            username,
            password: disgest,
            fullname
        };
        return User.create(newUser);
    })
    .then( result => {
       return res.status(201).location(`/api/users/${result.id}`).json(result)
    })
    .catch(err => {
        if(err.code === 11000){
            err = new Error('The username is already in use')
            err.status = 400;
        }
        next(err);        
    });
})


router.get('/', function (req,res,next) {
    return User.find()
    .then(result => res.json(result))
    .catch(err => next(err));
})

router.delete('/:id', function (req,res,next) {
    const id = req.params.id;
    return User.findByIdAndDelete(id)
    .then(() => res.sendStatus(204));
})

module.exports = router;