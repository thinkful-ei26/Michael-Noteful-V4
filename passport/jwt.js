const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt');
const { JWT_SECRET } = require('../config');
const User = require('../models/user');
const options = {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('bearer'),
    algorithms: ['HS256']
};

const jwtStrategy = new JwtStrategy(options,(payload,done) => {
    done(null,payload.user);
});

module.exports = jwtStrategy;