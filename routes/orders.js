const { Order } = require('../models/order');
const { OrderItem } = require('../models/order-item');
const express = require('express');
const router = express.Router();

// http://localhost:3000/api/v1/products
router.get(`/`, async (req, res) => {
    const orderList = await Order.find().populate('user', 'name').sort({'dateOrdered': -1 });
    if (!orderList) {
        res.status(500).json({ success: false })
    }
    res.send(orderList);
})

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
                            .populate('user', 'name')
                            .populate({ path: 'orderItems', populate: { 
                                          path: 'product', populate: 'category' }
                                        });
  if (!order) {
      res.status(500).json({ success: false })
  }
  res.send(order);
})

router.post(`/`, async (req, res) => {
  const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {

    let newOrderItem = new OrderItem({
      qauntity: orderItem.qauntity,
      product: orderItem.product
    })

    newOrderItem = await newOrderItem.save();

    return newOrderItem._id;
  }))

  const orderItemsIdsResolved = await orderItemsIds;

  const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId) => {
    const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
    const totalPrice = orderItem.product.price * orderItem.qauntity;
    return totalPrice
  }))

  const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: orderItemsIdsResolved,
    shippingAdress1: req.body.shippingAdress1,
    shippingAdress2: req.body.shippingAdress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered
  })
  order = await order.save();

  if (!order) {
    return res.status(404).send('Order cannot be created!')
  }
  res.send(order);
})

router.put('/:id', async (req, res) => {
  const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
          status: req.body.status
      },
      { new: true }
  )

  if (!order) {
    return res.status(404).send('Order cannot be updated!')
  }
  res.send(order);
})

// router.post(`/`, (req, res) => {
//   const order = new Order ({
//     name: req.body.name,
//     image: req.body.image,
//     countInStock: req.body.countInStock

//   })
//   order.save().then((createdOrder => {
//     res.status(201).json(createdOrder)
//   })).catch((err) => {
//     res.status(500).json({
//       error: err,
//       success: false
//         })
//     })
// })

router.delete('/:id', (req, res) => {
  Order.findByIdAndRemove(req.params.id).then(async order => {
    if (order) {
      await order.orderItems.map(async orderItem => {
        await OrderItem.findByIdAndRemove(orderItem)
      })
      return res.status(200).json({ success: true, message: 'the order was deleted!'})
    } else {
      return res.status(404).json({ success: false, message: 'Order does not exist!'})
    }
  }).catch(err=> {
    return res.status(400).json({ success: false, error: err })
  })
})

router.get('/get/totalsales', async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: '$totalPrices'}}}
  ])
  if (!totalSales) {
    return res.status(400).send('The order sales could not be generated!')
  }
  res.send({ totalsales: totalSales.pop().totalsales })
})

router.get('/get/count', async (req, res) => {
  const orderCount = await Order.countDocuments((count) => count);
    if (!orderCount) {
      res.status(500).json({ success: false })
    }
    res.send({ orderCount: orderCount });
})

router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid }).populate({ 
    path: 'orderItems', populate: { 
    path: 'product', populate: 'category' }
  }).sort({'dateOrdered': -1 });

  if (!userOrderList) {
      res.status(500).json({ success: false })
  }
  res.send(userOrderList);
})

module.exports = router;