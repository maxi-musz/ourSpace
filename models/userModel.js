import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
      },
    email : {
        type : String,
        unique : true,
        required : true
    },
    password : {
        type: String
    },
    profilePic : {
        type: String
    },
    role : {
        type: String,
        default: "user",
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    accountStatus: {
        type: String,
        default: "active",
        required: true
    },
    lastLogin: { type: Date },
    lastLogout: { type: Date },
    ourSpaceId: {
        type: String,
        default: generateOurSpaceId()
      }
},{
    timestamps : true
});

function generateOurSpaceId() {
    const randomDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    return `OS${randomDigits}`;
}


// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  // Encrypt password using bcrypt
  userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });
  
  const User = mongoose.model('User', userSchema);


export default User