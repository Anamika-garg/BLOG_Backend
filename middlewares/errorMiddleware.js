//Unsupported (404) routes


const notFound = (req , res , next)=>{
    const error = new Error(`Not Found ${req.originalUrl}`);
    res.status(404);
    next(error);
};


//Middleware to handle Errors

const errorHandler = (error , req , res , next)=>{
    // if(res.headerSent){

    //     return next(error)
    // // }

    res.json({
        error : error.message
    })
}


module.exports = {
    notFound , errorHandler
}