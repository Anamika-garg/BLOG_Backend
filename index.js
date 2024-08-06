const express = require('express');
const cors = require('cors');
const {connect} = require('mongoose');
require('dotenv').config();
const app = express();
const upload = require("express-fileupload");
const mongoose = require('mongoose')
const userRoutes = require('./routes/userRoutes')
const postRoutes = require('./routes/postRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

app.use(express.json({extended : true}));
app.use(express.urlencoded({extended : true}));
app.use(cors({credentials : true , origin : "http://localhost:5173"}))
app.use(upload())
app.use('/uploads' , express.static(__dirname + '/uploads'))


app.use('/api/users' , userRoutes);
app.use('/api/posts' , postRoutes);


app.use(notFound);
app.use(errorHandler);





mongoose.connect(process.env.MONGO_URI).then(app.listen(process.env.PORT || 5000 , () =>{
    console.log(`Server started on port ${process.env.PORT}`)})).catch(error => console.log(error))

