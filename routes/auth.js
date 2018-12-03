const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user');

const options = {session: false, failWithError: true};

const localAuth = passport.authenticate('local', options);

router.post('/', localAuth ,function (req,res,next) {
    console.log('more');
    return res.json(req.user);
});

module.exports = router;