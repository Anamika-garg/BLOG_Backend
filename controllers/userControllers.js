const bcryptjs = require('bcryptjs');
const HttpError = require("../models/errorModel");
const User = require("../models/userModel");
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { v4 : uuid} = require('uuid')

// Register a new User
// POST : api/users/register
//UNPROTECTED

const registerUser = async(req , res, next) =>{
    try {
        const {name , email , password , password2} = req.body;

        if(!name || !email || !password){
            return next(new HttpError("Fill in all the fields" , 422))
        }
        const newEmail = email.toLowerCase();

        const emailExists = await User.findOne({
            email : newEmail,
        });


        if(emailExists){
            return next(new HttpError("Email already exists!" , 422));
        }

        if((password.trim()).length < 6){
            return next(new HttpError("Password should be at least 6 characters" , 422));
        }

        if(password !== password2){
            return next(new HttpError("Passwords do not match" , 422))
        }

        const salt = await bcryptjs.genSalt(10);
        const hashedPass = await bcryptjs.hash(password , salt);

        const newUser = await User.create({
            name , email : newEmail , password : hashedPass
        })
        res.status(201).json(`New User ${newUser.email} has been registered successfully!`)


    } catch (error) {
        return next(new HttpError("User registeration failed" , 422));
    }
}











// login a new User
// POST : api/users/login
//UNPROTECTED

const loginUser = async(req , res, next) =>{
    try {
        const {email , password} = req.body;
        if(!email || !password){
            return next(new HttpError("Fill in all the details" , 422))
        }
        const newEmail = email.toLowerCase();

        const user = await User.findOne({email : newEmail});
        if(!user){
            return next(new HttpError("Invalid creditentails" , 422))
        }

        const camparePass = await bcryptjs.compare(password , user.password);

        if(!camparePass){
            return next(new HttpError("Invalid Creditentials" ,422))
        }

        const {_id : id , name} = user;
        const token = jwt.sign({id , name} , process.env.JWT_SECRET , {expiresIn : '1d'});

        res.status(200).json({token , id , name})




    } catch (error) {
        return next(new HttpError("Login failed. Please check your credentials" , 422));
    }
}











// User profile
// POST : api/users/:id
//PROTECTED

const getUser = async(req , res, next) =>{
    try {
        const {id} = req.params;
        const user = await User.findById(id).select('-password');
        if(!user){
            return next(new HttpError("User Not found" , 404))
        }
        console.log(user)
        res.status(200).json(user);

    } catch (error) {
        return next(new HttpError(error));
    }
}











// change user avatar
// POST : api/users/change-avatar
//PROTECTED

const changeAvatar = async(req , res, next) =>{
    try {
        if(!req.files.avatar){
            return next(new HttpError("Please choose an image" , 422))
        }

        // find user form db
        const user = await User.findById(req.user.id)


        //delete old avatar , if exists!
        if(user.avatar){

            fs.unlink(path.join(__dirname , '..' , 'uploads' , user.avatar) , (err)=>{
                if(err){
                    return next(new HttpError(err))
                }
            })
        }

        const {avatar} = req.files;

        //check file size
        if(avatar.size > 500000){
            return next(new HttpError("Profile pic too big. should be under 500kbytes"))
        }

        let fileName;

        fileName = avatar.name;
        let splittedFileName = fileName.split('.');
        let newFileName = splittedFileName[0] + uuid() + '.' + splittedFileName[splittedFileName.length - 1];

        avatar.mv(path.join(__dirname , '..' , 'uploads' , newFileName) , async(err)=>{
            if(err){
                return next(new HttpError(err))
            }

            const updatedAvatar = await User.findByIdAndUpdate(req.user.id , {avatar : newFileName} , {new : true});

            if(!updatedAvatar){
                return next(new HttpError("Avatar can't be changed" , 422))
            }
            res.status(200).json(updatedAvatar)
        })

    } catch (error) {
        return next(new HttpError(error))
    }
}











// edit user details
// POST : api/users/edit-user
//PROTECTED

const editUser = async(req , res, next) =>{
    try {
        const {name , email , currentPassword , newPassword , confirmNewPassword} = req.body;

        if(!name || !email || !currentPassword || !newPassword){
            return next(new HttpError("FIll in all the fields" , 402))
        }

        //get user from db
        const user = await User.findById(req.user.id)
        if(!user){
            return next(new HttpError("User not Found" , 403));
        }

        //make sure new email doesn't already exists
        const emailExists = await User.findOne({email});
        //we want to update other details with/without changing the email (unique id which we use to login)

        if(emailExists && (emailExists._id != req.user.id)){
            return next(new HttpError("Email Already existss" , 422))
        }

        //comapre curremt password to db pswd

        const validUserPassowrd = await bcryptjs.compare(currentPassword , user.password);
        if(!validUserPassowrd){
            return next(new HttpError("Invalid Current Password" , 422))
        }

        //compare new passwords

        if(newPassword !== confirmNewPassword){
            return next(new HttpError("New Password do not match" , 422))
        }

        //hash new pswd
        const salt = await bcryptjs.genSalt(10);
        const Hash = await bcryptjs.hash(newPassword  , salt)


        //update user info in db

        const newInfo = await User.findByIdAndUpdate(req.user.id , {name , email , password:Hash})

        res.status(200).json(newInfo);
    } catch (error) {
        
    }
}











// get authors
// POST : api/users/authors
//UNPROTECTED

const getAuthors = async(req , res, next) =>{
    try {
        const authors = await User.find().select('-password');
        res.json(authors);

    } catch (error) {
        return next(new HttpError(error))
    }
}













module.exports = {
    registerUser , loginUser , changeAvatar , editUser , getAuthors , getUser
}

