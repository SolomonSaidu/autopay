import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token found" });

  try {
    const decode = jwt.verify(token, process.env.SECRET_KEY);
    req.users = decode;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

export default protect;
