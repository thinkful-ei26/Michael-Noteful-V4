const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    fullname: {type: String}
})

userSchema.set('toJSON', {
    virtuals:true,
    transform: (doc, result) => {
        delete result._id;
        delete result.__v;
        delete result.password;
    }
})

// userSchema.methods.validatePassword = function (incomingPassword) {
//     const user = this; // for clarity
//     return incomingPassword === user.password;
// };

userSchema.methods.validatePassword = function (incomingPassword) {
    return bcrypt.compare(incomingPassword, this.password);
};
  
userSchema.statics.hashPassword = function (incomingPassword) {
    const digest = bcrypt.hash(incomingPassword, 10);
    return digest;
};

module.exports = mongoose.model('User', userSchema);