const express = require("express");
const employeeChecker = require("../middleware/employeeChecker");
const fetchAll = require("../utils/fetchAll");
const router = express.Router();

router.get("/", employeeChecker, async (req, res) => {
  try {
    const all = await fetchAll(req.user.userID);

    const items = all.filter(
      (item) => item.subHotel === true && item.status === "approved"
    );

    const count = parseInt(req.query.count) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * count;
    const itemsCount = items.length;
    const totalPages = Math.ceil(itemsCount / count);

    const paginatedData = items.slice(skip, skip + count);

    res.send({
      page,
      totalPages,
      itemsCount,
      items: paginatedData,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({ error: "Couldn't get all sub-hotels" });
  }
});

module.exports = router;
