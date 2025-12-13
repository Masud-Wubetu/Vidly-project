const auth = require('../middleWare/auth');
const { Rental, validate } = require('../models/rental');
const { Movie } = require('../models/movie');
const { Customer } = require('../models/customer');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();


router.get('/', async (req, res) => {
    const rentals = (await Rental.find()).toSorted('-dateOut');
    res.send(rentals);
});

router.post('/', auth, async (req, res) => {
  // Validate customer
  const customer = await Customer.findById(req.body.customerId);
  if (!customer) return res.status(400).send('Invalid customer.');

  // Validate movie
  const movie = await Movie.findById(req.body.movieId);
  if (!movie) return res.status(400).send('Invalid movie.');

  if (movie.numberInStock === 0)
    return res.status(400).send('Movie not in stock.');

  // Start Transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create rental document
    const rental = new Rental({
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone
      },
      movie: {
        _id: movie._id,
        title: movie.title,
        dailyRentalRate: movie.dailyRentalRate
      }
    });

    await rental.save({ session });

    // Update movie stock
    await Movie.updateOne(
      { _id: movie._id },
      { $inc: { numberInStock: -1 } },
      { session }
    );

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.send(rental);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).send('Transaction failed.');
  }
});

module.exports = router;