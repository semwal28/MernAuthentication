import jwt from 'jsonwebtoken';

const userAuth = async (req, res, next) => {
    const {token} = req.cookies;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized access" });
    }
 try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET)

    if(tokenDecode?.id) {
        req.userId = tokenDecode.id;
        return next();
    }else {
        return res.status(401).json({ message: "Unauthorized access" });
    }
    
 } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }    
 }

 export default userAuth;
