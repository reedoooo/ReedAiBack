const multer = require("multer");

const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors
    res.status(400).json({ error: err.message });
  } else if (err) {
    // Other errors
		const statusCode = res.statusCode ? res.statusCode : 500;

		res.status(statusCode);

		res.json({
			message: err.message,
			stack: err.stack,
		});
  } else {
    next();
  }
};

module.exports = {
  errorHandler,
};
