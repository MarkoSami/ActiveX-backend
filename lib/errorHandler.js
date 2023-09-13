const mongoose = require('mongoose');

const errorHandler = (err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    // Customize error messages based on the validation error
    const customErrors = {};

    // Loop through the validation errors and customize messages
    for (const field in err.errors) {
      customErrors[field] = err.errors[field].message;
    }

    res.status(403).json({ errors: customErrors });
  }
  next();
};

module.exports = { errorHandler };
