const express = require('express')
const router = express.Router()
const ExcelJS = require('exceljs')
const User = require('../models/User')
const Reservation = require('../models/Reservation.js')
const Ticket = require('../models/Ticket.js')
const adminChecker = require('../middleware/adminChecker.js')
const fetchAll = require('../utils/fetchAll.js')
const PDFDocument = require('pdfkit')

router.get('/tickets/:id/:place', adminChecker, async (req, res) => {
  try {
    let matchQuery = {}

    if (req.params.place && req.params.place !== 'all') {
      matchQuery.ID = req.params.place
    } else {
    }

    if (req.params.id === 'premium') {
      matchQuery.isPremium = true
    } else if (req.params.id === 'regular') {
      matchQuery.isPremium = !true
    } else if (req.params.id === 'all') {
    } else {
      return res.status(400).send({ error: 'Invalid type' })
    }

    const data = await Ticket.aggregate([{ $match: matchQuery }])

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    worksheet.addRow([
      'Name',
      'Email',
      'Phone',
      'Event',
      'People',
      'Premium',
      'Time',
      'Booked on',
      'ticket ID',
    ])

    data.forEach((customer) => {
      worksheet.addRow([
        customer.firstName + ' ' + customer.lastName,
        customer.email,
        customer.phoneNumber,
        customer.name,
        customer.people,
        customer.isPremium ? 'Yes' : 'No',
        customer.time,
        customer.date,
        customer.ticketID,
      ])
    })

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader('Content-Disposition', 'attachment; filename=tickets.xlsx')
      res.send(buffer)
    })
  } catch (err) {
    console.log(err)
    res.status(400).send({ error: 'Could not get overview' })
  }
})

router.get('/reservations/:id/:place', adminChecker, async (req, res) => {
  try {
    let matchQuery = {}

    if (req.params.place && req.params.place !== 'all') {
      matchQuery.ID = req.params.place
    } else {
    }

    if (req.params.id !== 'all') {
      matchQuery.status = req.params.id
    }

    const data = await Reservation.aggregate([{ $match: matchQuery }])

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    worksheet.addRow([
      'Name',
      'Email',
      'Phone',
      'Place',
      'People',
      'Date',
      'Time',
      'Status',
      'Reserved on',
      'Reservation ID',
    ])

    data.forEach((customer) => {
      const createdAt = customer.time
      const timestamp = customer.createdAt
      const date = new Date(timestamp)

      const year = date.getUTCFullYear()
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
      const day = date.getUTCDate().toString().padStart(2, '0')

      const readableDate = `${month}/${day}/${year}`

      worksheet.addRow([
        customer.firstName + ' ' + customer.lastName,
        customer.email,
        customer.phoneNumber,
        customer.name,
        customer.people,
        customer.date,
        customer.time,
        customer.status,
        readableDate,
        customer.reservationID,
      ])
    })

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=reservations.xlsx',
      )
      res.send(buffer)
    })
  } catch (err) {
    console.log(err)
    res.status(400).send({ error: 'Could not get overview' })
  }
})

router.get('/reservations/pdf/:id/:place', adminChecker, async (req, res) => {
  try {
    let matchQuery = {}

    if (req.params.place && req.params.place !== 'all') {
      matchQuery.ID = req.params.place
    } else {
    }

    if (req.params.id !== 'all') {
      matchQuery.status = req.params.id
    }

    const data = await Reservation.aggregate([{ $match: matchQuery }])

    const companyInfo = {
      name: 'Peomax',
      email: 'Info@peomax.com',
      phone: '+251939333079',
    }

    const doc = new PDFDocument({ size: 'letter', layout: 'landscape' }) // Set landscape orientation

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=reservations.pdf',
    )
    doc.pipe(res)
    const logoPath = './assets/peomax.jpg'
    doc.image(logoPath, 50, 30, { width: 100 })
    doc.fontSize(12).text(`Company: ${companyInfo.name}`, 530, 50)
    doc.fontSize(12).text(`Email: ${companyInfo.email}`, 530, 70)
    doc.fontSize(12).text(`Phone: ${companyInfo.phone}`, 530, 90)

    const headers = [
      { name: 'Name', width: 100 },
      { name: 'Email', width: 120 },
      { name: 'Phone', width: 130 },
      { name: 'People', width: 120 },
      { name: 'Date', width: 105 },
      { name: 'Service', width: 110 },
    ]
    const headerSpacing = 25

    doc.fontSize(16).text(`Reservation Details`, 50, 150)
    let y = 180
    let x = 50
    headers.forEach((header, index) => {
      doc.fontSize(12).text(header.name, x + header.width * index, y)
    })
    y += headerSpacing

    const addNewPage = () => {
      doc.addPage({ size: 'letter', layout: 'landscape' }) // Set landscape orientation for new pages
      doc.image(logoPath, 50, 30, { width: 100 })
      doc.fontSize(16).text(`Reservation Details`, 50, 150)
      doc.fontSize(12).text(`Company: ${companyInfo.name}`, 530, 30)
      doc.fontSize(12).text(`Email: ${companyInfo.email}`, 530, 50)
      doc.fontSize(12).text(`Phone: ${companyInfo.phone}`, 530, 70)
      let newY = 180
      headers.forEach((header, index) => {
        doc.fontSize(12).text(header.name, x + header.width * index, newY)
      })
      newY += headerSpacing
      return newY
    }

    let currentY = y

    data.forEach((dataItem) => {
      if (currentY > 500) {
        // Adjusted space for landscape orientation
        currentY = addNewPage()
      }

      const timestamp = dataItem.createdAt
      const date = new Date(timestamp)
      const year = date.getUTCFullYear()
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0')
      const day = date.getUTCDate().toString().padStart(2, '0')

      const readableDate = `${month}/${day}/${year}`
      const filteredData = {
        name: dataItem.firstName + ' ' + dataItem.lastName,
        email: dataItem.email,
        phoneNumber: dataItem.phoneNumber,
        people: dataItem.people,
        TimeAndDate: dataItem.date + ' ' + dataItem.time,
        Status: dataItem.name,
      }
      Object.keys(filteredData).forEach((key, index) => {
        const value = filteredData[key]

        if (value !== undefined && value !== null) {
          const cellWidth = headers[index].width
          doc
            .fontSize(10)
            .text(value.toString(), x + cellWidth * index, currentY, {
              width: cellWidth,
              align: 'left',
              lineBreak: true,
            })
        } else {
          doc
            .fontSize(10)
            .text('N/A', x + headers[index].width * index, currentY)
        }
      })

      currentY += headerSpacing
    })

    const yourName = `Wasihun Tefera`
    doc.fontSize(12).text(yourName, 50, currentY + 50)

    const logoPathh = './assets/signiture.png'
    doc.image(logoPathh, 80, currentY + 60, { width: 100 })

    doc
      .moveTo(50, currentY + 120)
      .lineTo(250, currentY + 120)
      .stroke()

    doc.end()
  } catch (err) {
    console.log(err)
  }
})

router.get('/users/:role', adminChecker, async (req, res) => {
  try {
    const { start, end } = req.query
    let data

    if (req.params.role === 'all') {
      data = await User.find({})
      data = data.sort((a, b) => a.credits - b.credits)
    } else {
      data = await User.find({ role: req.params.role })
      data = data.sort((a, b) => a.credits - b.credits)
    }

    if (start && end) {
      if (isNaN(parseInt(start)) || parseInt(start) < 1 || isNaN(parseInt(end)))
        return res.status(400).send({ error: 'Invalid numbers' })

      data = data.filter((item) => item.credits <= end && item.credits >= start)
      data = data.sort((a, b) => a.credits - b.credits)
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    worksheet.addRow([
      'Name',
      'Email',
      'reference',
      'Banned',
      'Credits',
      'role',
      'User ID',
    ])

    data.forEach((customer) => {
      worksheet.addRow([
        customer.name
          ? customer.name
          : customer.firstName + ' ' + customer.lastName,
        customer.email,
        customer.reference,
        customer.isBanned == true ? 'Yes' : 'No',
        customer.credits,
        customer.role,
        customer.userID,
      ])
    })

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx')
      res.send(buffer)
    })
  } catch (err) {
    console.log(err)
    res.status(400).send({ error: 'Could not get overview' })
  }
})

router.get('/users/pdf/:role', adminChecker, async (req, res) => {
  try {
    const { start, end } = req.query
    let data

    if (req.params.role === 'all') {
      data = await User.find({})
      data = data.sort((a, b) => a.credits - b.credits)
    } else {
      data = await User.find({ role: req.params.role })
      data = data.sort((a, b) => a.credits - b.credits)
    }

    if (start && end) {
      if (isNaN(parseInt(start)) || parseInt(start) < 1 || isNaN(parseInt(end)))
        return res.status(400).send({ error: 'Invalid numbers' })

      data = data.filter((item) => item.credits <= end && item.credits >= start)
      data = data.sort((a, b) => a.credits - b.credits)
    }
    const companyInfo = {
      name: 'Peomax',
      email: 'Info@peomax.com',
      phone: '+251939333079',
    }

    const doc = new PDFDocument({ size: 'letter', layout: 'landscape' }) // Set landscape orientation

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=users.pdf')
    doc.pipe(res)
    const logoPath = './assets/peomax.jpg'
    doc.image(logoPath, 50, 30, { width: 100 })
    doc.fontSize(12).text(`Company: ${companyInfo.name}`, 530, 50)
    doc.fontSize(12).text(`Email: ${companyInfo.email}`, 530, 70)
    doc.fontSize(12).text(`Phone: ${companyInfo.phone}`, 530, 90)
    const headers = [
      { name: 'Name', width: 100 },
      { name: 'Email', width: 140 },
      { name: 'reference', width: 145 },
      { name: 'Banned', width: 135 },
      { name: 'Credits', width: 120 },
      { name: 'role', width: 110 },
      { name: 'User ID', width: 100 },
    ]
    const headerSpacing = 25
    doc.fontSize(16).text(`Users Details`, 50, 150)
    let y = 180
    let x = 50
    headers.forEach((header, index) => {
      doc.fontSize(12).text(header.name, x + header.width * index, y)
    })
    y += headerSpacing

    const addNewPage = () => {
      doc.addPage({ size: 'letter', layout: 'landscape' }) // Set landscape orientation for new pages
      doc.image(logoPath, 50, 30, { width: 100 })
      doc.fontSize(16).text(`Users Details`, 50, 150)
      doc.fontSize(12).text(`Company: ${companyInfo.name}`, 530, 30)
      doc.fontSize(12).text(`Email: ${companyInfo.email}`, 530, 50)
      doc.fontSize(12).text(`Phone: ${companyInfo.phone}`, 530, 70)
      let newY = 180
      headers.forEach((header, index) => {
        doc.fontSize(12).text(header.name, x + header.width * index, newY)
      })
      newY += headerSpacing
      return newY
    }

    let currentY = y

    data.forEach((user) => {
      if (currentY > 500) {
        // Adjusted space for landscape orientation
        currentY = addNewPage()
      }
      const filteredData = {
        name: user.name ? user.name : user.firstName + ' ' + user.lastName,
        email: user.email,
        reference: user.reference,
        isBanned: user.isBanned == true ? 'Yes' : 'No',
        credits: user.credits,
        role: user.role,
        userID: user.userID,
      }
      Object.keys(filteredData).forEach((key, index) => {
        const value = filteredData[key]

        if (value !== undefined && value !== null) {
          const cellWidth = headers[index].width
          doc
            .fontSize(10)
            .text(value.toString(), x + cellWidth * index, currentY, {
              width: cellWidth,
              align: 'left',
              lineBreak: true,
            })
        } else {
          doc
            .fontSize(10)
            .text('N/A', x + headers[index].width * index, currentY)
        }
      })

      currentY += headerSpacing
    })
    const yourName = `Wasihun Tefera`
    doc.fontSize(12).text(yourName, 50, currentY + 50)

    const logoPathh = './assets/signiture.png'
    doc.image(logoPathh, 80, currentY + 60, { width: 100 })

    doc
      .moveTo(50, currentY + 120)
      .lineTo(250, currentY + 120)
      .stroke()

    doc.end()
  } catch (err) {
    console.log(err)
  }
})

router.get('/:category/', adminChecker, async (req, res) => {
  try {
    const { start, end } = req.query
    let data = await fetchAll()

    if (req.params.category !== 'all') {
      data = data.filter((item) => item.category == req.params.category)
    }

    if (start && end) {
      if (isNaN(parseInt(start)) || parseInt(start) < 1 || isNaN(parseInt(end)))
        return res.status(400).send({ error: 'Invalid numbers' })

      data = data.filter((item) => item._rank <= end && item._rank >= start)
      data = data.sort((a, b) => a._rank - b._rank)
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Sheet1')

    worksheet.addRow([
      'Name',
      'Description',
      'category',
      'Location',
      'Rating',
      'Featured',
      'Total Spots',
      'Rank',
      'Phone Number',
      'Website',
      'Status',
    ])

    data.forEach((customer) => {
      worksheet.addRow([
        customer.name,
        customer.description,
        customer.category,
        customer.location,
        customer.rating,
        customer.isPremium.toString(),
        customer.totalSpots,
        customer._rank,
        customer.phoneNumber,
        customer.website,
        customer.status,
      ])
    })

    workbook.xlsx.writeBuffer().then((buffer) => {
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      )
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=companies.xlsx',
      )
      res.send(buffer)
    })
  } catch (err) {
    console.log(err)
    res.status(400).send({ error: 'Could not get overview' })
  }
})

router.get('/category/pdf/:category', adminChecker, async (req, res) => {
  try {
    const { start, end } = req.query
    let data = await fetchAll()

    if (req.params.category !== 'all') {
      data = data.filter((item) => item.category == req.params.category)
    }

    if (start && end) {
      if (isNaN(parseInt(start)) || parseInt(start) < 1 || isNaN(parseInt(end)))
        return res.status(400).send({ error: 'Invalid numbers' })

      data = data.filter((item) => item._rank <= end && item._rank >= start)
      data = data.sort((a, b) => a._rank - b._rank)
    }

    const companyInfo = {
      name: 'Peomax',
      email: 'Info@peomax.com',
      phone: '+251939333079',
    }
    const doc = new PDFDocument({ size: 'letter', layout: 'landscape' }) // Set landscape orientation

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=service.pdf`)
    doc.pipe(res)
    const logoPath = './assets/peomax.jpg'
    doc.image(logoPath, 50, 30, { width: 100 })
    doc.fontSize(12).text(`Company: ${companyInfo.name}`, 530, 50)
    doc.fontSize(12).text(`Email: ${companyInfo.email}`, 530, 70)
    doc.fontSize(12).text(`Phone: ${companyInfo.phone}`, 530, 90)

    const headers = [
      { name: 'Name', width: 100 },
      { name: 'Phone Number', width: 120 },
      { name: 'Location', width: 120 },
      { name: 'Rating', width: 130 },
      { name: 'Featured', width: 115 },
      { name: 'Status', width: 105 },

      { name: 'Total Spots', width: 100 },
    ]
    const headerSpacing = 25

    doc.fontSize(16).text(`${req.params.category}s Detail`, 50, 150)
    let y = 180
    let x = 50
    headers.forEach((header, index) => {
      doc.fontSize(12).text(header.name, x + header.width * index, y)
    })
    y += headerSpacing

    const addNewPage = () => {
      doc.addPage({ size: 'letter', layout: 'landscape' }) // Set landscape orientation for new pages
      doc.image(logoPath, 50, 30, { width: 100 })
      doc.fontSize(16).text(`${req.params.category}s Detail`, 50, 150)
      doc.fontSize(12).text(`Company: ${companyInfo.name}`, 530, 30)
      doc.fontSize(12).text(`Email: ${companyInfo.email}`, 530, 50)
      doc.fontSize(12).text(`Phone: ${companyInfo.phone}`, 530, 70)
      let newY = 180
      headers.forEach((header, index) => {
        doc.fontSize(12).text(header.name, x + header.width * index, newY)
      })
      newY += headerSpacing
      return newY
    }

    let currentY = y

    data.forEach((dataItem) => {
      if (currentY > 500) {
        currentY = addNewPage()
      }
      const filteredData = {
        name: dataItem.name,
        phoneNumber: dataItem.phoneNumber,
        category: dataItem.location,
        rating: dataItem.rating,
        Featured: dataItem.isPremium == true ? 'Yes' : 'No',
        Status: dataItem.status,

        TotalSpots: dataItem.totalSpots,
      }
      Object.keys(filteredData).forEach((key, index) => {
        const value = filteredData[key]

        if (value !== undefined && value !== null) {
          const cellWidth = headers[index].width
          doc
            .fontSize(10)
            .text(value.toString(), x + cellWidth * index, currentY, {
              width: cellWidth,
              align: 'left',
              lineBreak: true,
            })
        } else {
          doc
            .fontSize(10)
            .text('N/A', x + headers[index].width * index, currentY)
        }
      })

      currentY += headerSpacing
    })

    const yourName = `Wasihun Tefera`
    doc.fontSize(12).text(yourName, 50, currentY + 50)

    const logoPathh = './assets/signiture.png'
    doc.image(logoPathh, 80, currentY + 60, { width: 100 })

    doc
      .moveTo(50, currentY + 120)
      .lineTo(250, currentY + 120)
      .stroke()

    doc.end()
  } catch (err) {
    console.log(err)
  }
})
module.exports = router
