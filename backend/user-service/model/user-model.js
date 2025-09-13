import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserModelSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 5,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    //add more password validation if needed
  },
  createdAt: {
    type: Date,
    default: Date.now, // Setting default to the current date/time
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  isVerified: {
    type: Boolean,
    required: true,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
    profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
      default: null,
    },
  },
});


UserModelSchema.index({ isAdmin: 1 });
UserModelSchema.index({ isActive: 1 });
UserModelSchema.index({ createdAt: -1 });

// Pre-save middleware to update updatedAt
UserModelSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Pre-update middleware to update updatedAt
UserModelSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for full name
UserModelSchema.virtual('profile.fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || this.username;
});

// Transform function to handle JSON serialization
UserModelSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});


export default mongoose.model("UserModel", UserModelSchema);
