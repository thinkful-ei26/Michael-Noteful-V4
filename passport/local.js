const {Strategy: LocalStrategy} = require('passport-local');
const User = require('../models/user');
const localStrategy = new LocalStrategy((username,password,done) => {
    let user;
    User.findOne({username})
    .then(result => {
        user = result;
       
        if(!result){
            return Promise.reject({
                reason: 'InvalidLogin',
                message: 'Invalid Username',
                location: 'username'
            });
        }
        const validatePassword = user.validatePassword(password);
        if(!validatePassword){
            return Promise.reject({
                reason: 'InvalidLogin',
                message: 'Invalid password',
                location: 'password'
            })
        }
        return done(null, user);
    })
    .catch(err => {
        if(err.reason ='InvalidLogin'){
            return done(null,false);
        }
        return done(err);
    });
})

module.exports = localStrategy;
