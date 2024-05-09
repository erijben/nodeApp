const jwt = require("jsonwebtoken");
require('dotenv').config()

module.exports = async (req, res, next) => {
    const token = req.header('Authorization') ? req.header('Authorization').split(' ')[1] : null;

    // CHECK IF WE EVEN HAVE A TOKEN
    if(!token){
        res.status(401).json({
            errors: [
                {
                    msg: "No token found"
                }
            ]
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // decoded contient l'ID et le rôle de l'utilisateur
        next();
    } catch (error) {
        res.status(400).json({ msg: 'Token is not valid' });
    }
}