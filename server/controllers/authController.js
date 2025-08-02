import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/UserModel.js";
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js"; 
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingUser = await userModel.findOne({email});
    if (existingUser) {
      return res.status(400).json({ success:false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h'});

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
       return res.status(200).json({ success: true, message: "Registration successful" });

  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Internal server error" });
    n;
  }
};

export const login = async (req, res) => {
  const {email, password} = req.body;

  if (!email || !password) {
    return res.status(400).json({ sucess:false, message: "All fields are required" });
  }

try{
  const user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).json({ sucess:false, message: "Invalid email or password" });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ sucess:false, message: "Invalid email or password" });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
   if(user && user.email){
   const mailOptions ={
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: 'Welcome to Our Service',
    text: `Hello ${email},\n\nYou have successfully created your account.\n\nBest regards,\nYour Team`      
   }
    await transporter.sendMail(mailOptions) 
   }else{
    console.error("user email skipping")
   }
   return res.status(200).json({ success: true, message: "Login successful" });

}
catch (error) {
  console.error("Error during login:", error);
  return res.status(500).json({sucess:false, message: "Internal server error" });
}
}

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Strict',
  });
  return res.status(200).json({ success: true, message: "Logout successful" });
};


export const sendVerifyOtp = async (req, res) => {

  try {
    const userId  = req.userId;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.status(400).json({ success: false, message: "Account already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.verifyOtp = otp

    user.verifyOtpExpires = Date.now() + 24 * 60 * 60 * 1000; 
    await user.save();

  const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Account Verification OTP',
      // text: `Your OTP for account verification is: ${otp}\n\nThis OTP is valid for 24 hours.`,
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Verification OTP sent successfully" });
  }
  catch (error) {
    console.error("Error sending verification OTP:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const verifyEmail = async (req, res) => {
      const {otp} = req.body;
     const userId = req.userId;
if (!userId || !otp) {
  return res.status(400).json({ success: false, message: "User ID and OTP are required" });
}
  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    } 
    if (user.verifyOtp !== otp || user.verifyOtp === " ") {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.verifyOtpExpires < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }
    user.isAccountVerified = true;
    user.verifyOtp = null;
    user.verifyOtpExpires = null;
    await user.save();
    return res.status(200).json({ success: true, message: "Email verified successfully" });
  }
  catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const isAuthenticated = async (req, res) => {
  try{
     return res.status(200).json({ success: true, message: "User is authenticated"});   
  } catch (error) {
    console.error("Error during authentication:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

//send password reset otp

export const sendResetOtp = async (req, res)=>{
  const {email} = req.body;
  
  if(!email){
    return res.json({success: false, message: "Email is required"})
  }

 try {
  
  const user = await userModel.findOne({email});
  if(!user){
    return res.json({success: false, message: "User not found"})
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.resetOtp = otp

    user.verifyOtpExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

  const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Password Reset OTP',
      // text: `Your OTP for Password Reset is: ${otp}\n\nThis OTP is valid for 15mins.`,
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}", user.email)
    };

    await transporter.sendMail(mailOptions);

    return res.json({success: true, message: "Otp sent successfully"})

 } catch (error) {

  return res.json({success:false, message: error.message})
  
 }
}

// Reset and Verify the password and otp

export const resetPassword = async (req,res)=>{
  const {email, otp, newPassword} = req.body;
  if(!email || !otp || !newPassword){
    return res.json({ success:false, message:"Email, OTP, and new password is required"
    })
  }
  try {

    const user = await userModel.findOne({email})
    if(!user){
      return res.json({success: false, message:"User Not found"})
    }
    if(user.resetOtp ==="" || user.resetOtp !== otp){
      return res.json({success: false, message:"invalid otp"})
    }
    if(user.resetOtpExpireAt < Date.now()){
      return res.json({success: false, message:"OTP Expired"})
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword;
    user.resetOtp = " ";
    user.resetOtpExpireAt = 0;

    await user.save()

    return res.json({ success: true, message: " User has successfully reset the password" })
  } catch (error) {
    return res.json({success: false, message: error.message})
  }
}