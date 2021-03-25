const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJwt = require('./helpers/jwt');
// const errorHandler = require('./helpers/error-handler');

require('dotenv/config');

app.use(cors());
app.options('*', cors());

//middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use((err, req, res, next) => {
      if (err.name === 'UnauthorizedError') {
        return res.status(500).json({ message: 'The User is not Authorized!' })
      }
  
      if (err.name === 'ValidationError') {
          return res.status(401).json({ message: err })
      }
  
      return res.status(500).json(err);
  });

//routes
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const ordersRoutes = require('./routes/orders');
const usersRoutes = require('./routes/users'); 
 
const api = process.env.API_URL;

app.use(`${api}/products`, productsRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/categories`, categoriesRoutes);

mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'kind2earth'
})
.then(() => {
  console.log("Database Connection is ready");
}).catch((err) => {
  console.log(err); 
})

// app.listen(3000, () => {
//     console.log(api);
//     console.log('server is running http://localhost:3000')
// })

var server = app.listen(process.env.PORT || 3000, function() {
  var port = server.address().port;
  console.log("Express is working on port " + port)
})


