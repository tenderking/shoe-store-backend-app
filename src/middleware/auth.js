const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      status: 'fail',
      data: {
        status: 'fail',
        statusCode: 401,
        result: "Error! Token was not provided."
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'fail',
        data: {
          status: 'fail',
          statusCode: 401,
          result: "Invalid token. Please log in again."
        }
      });
    }
    console.log(err);
    return res.status(500).json({
      status: 'fail',
      data: {
        status: 'fail',
        statusCode: 500,
        result: "Internal Server Error"
      }
    });
  }
};