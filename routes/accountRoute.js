const express = require('express')
const User = require('../models/User.js')
const Reservation = require('../models/Reservation.js')
const userChecker = require('../middleware/userChecker.js')
const extractMain = require('../utils/extractMain.js')
const fetchAll = require('../utils/fetchAll.js')

const router = express.Router()

router.get('/', userChecker, async (req, res) => {
  try {
    if (!req.user.userID) return res.status(404).send({ error: 'No user' })

    const user = await User.findOne(
      { userID: req.user.userID },
      { password: 0 },
    )

    if (!user) return res.status(404).send({ error: 'User not found' })

    if (user.role == 'employee') {
      const items = await fetchAll(req.user.userID)

      if (items == []) return res.send(user.toObject())
      res.send({
        ...user.toObject(),
        ID: items[0].ID,
        category: items[0].category,
      })
    } else if (user.role == 'supervisor' || user.role == 'manager') {
      const main = await extractMain(req.user.userID)
      if (!main) return res.send(user.toObject())

      res.send({
        ...user.toObject(),
        ID: main.ID,
        category: main.category,
      })
    } else {
      const reservations = await Reservation.find({ userID: req.user.userID })
      res.send({
        ...user.toObject(),
        reservations,
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).send({ error: 'Error getting user' })
  }
})

router.put('/update', userChecker, async (req, res) => {
  try {
    if (!req.user.userID) return res.status(404).send({ error: 'No user' })

    const user = await User.findOne(
      { userID: req.user.userID },
      { password: 0 },
    )

    if (!user) return res.status(404).send({ error: 'User not found' })

    const { firstName, lastName } = req.body
    user.firstName = firstName
    user.lastName = lastName

    await user.save()

    res.send(user.toObject())
  } catch (error) {
    console.error(error)
    res.status(500).send({ error: "Couldn't update user data" })
  }
})

module.exports = router
