import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const waitlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email : {
        type : String,
        unique : true,
        required : true
    },
    numberOfProperties : {
        type: Number,
        default: 0,
        required: true
    },
    propertyType : {
        type: String,
        required: true
    },
    location : {
        type: String,
        required: true
    },
    phoneNumber : {
        type: String,
        required: true
    },
    lastLogin: { type: Date },
    lastLogout: { type: Date },
},{
    timestamps : true
});


// Match user entered password to hashed password in database
waitlistSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };
  
  // Encrypt password using bcrypt
  waitlistSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      next();
    }
  
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  });
  
  const Waitlist = mongoose.model('Waitlist', waitlistSchema);


export default Waitlist

