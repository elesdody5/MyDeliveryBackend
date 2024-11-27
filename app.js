const express = require("express");
const compression = require("compression");
const cors = require("cors");
const userRouter = require("./api/routes/userRouter");
const shopRouter = require("./api/routes/shopRouter");
const categoryRouter = require("./api/routes/categoryRouter");
const productRouter = require("./api/routes/productRouter");
const offerRouter = require("./api/routes/offerRouter");
const safeTransactionsRouter = require("./api/routes/safeTransactionRouter");
const subCategoriesRouter = require("./api/routes/subCategoryRouter");
const serviceRouter = require("./api/routes/serviceRouter");
const favoriteRouter = require("./api/routes/favoriteRouter");
const quickOrderRouter = require("./api/routes/quickOrderRouter");
const notificationRouter = require("./api/routes/notificationRouter");
const reviewRouter = require("./api/routes/reviewRouter");
const recordRouter = require("./api/routes/recordRouter");
const AppError = require("./api/utils/appError");

const app = express();
app.use(compression());
app.use(express.urlencoded({ extended: true }));
//core middlewares
app.use(express.json());

const globalErrorHandler = require("./api/controllers/errorController");

app.use(cors());

app.options("*", cors());
app.use("/api/v1/users", userRouter); //Request will hit this first and then match with one of userRouters.
app.use("/api/v1/shops", shopRouter); //Request will hit this first and then match with one of shopRouters.
app.use("/api/v1/categories", categoryRouter); //Request will hit this first and then match with one of categoryRouters.
app.use("/api/v1/products", productRouter); //Request will hit this first and then match with one of productRouters.
app.use("/api/v1/subCategories", subCategoriesRouter); //Request will hit this first and then match with one of subCategoriesRouter.
app.use("/api/v1/offers", offerRouter); //Request will hit this first and then match with one of offersRouter
app.use("/api/v1/services", serviceRouter); //Request will hit this first and then match with one of serviceRouter
app.use("/api/v1/favorites", favoriteRouter); //Request will hit this first and then match with one of favorites router
app.use("/api/v1/quickOrders", quickOrderRouter); //Request will hit this first and then match with one of quickorders router
app.use("/api/v1/notifications", notificationRouter); //Request will hit this first and then match with one of notification router
app.use("/api/v1/reviews", reviewRouter); //Request will hit this first and then match with one of review router
app.use("/api/v1/records", recordRouter); //Request will hit this first and then match with one of record router
app.use("/api/v1/safeTransactions", safeTransactionsRouter); //Request will hit this first and then match with one of safe router
//If there is no matching route this middleware will be FIRED!
app.all("*", (req, res, next) => {
  /*if next took an argument -> express will detect that there is an error and will skip all the middlewares 
    and goes to the GLOBAL ERROR HANDLER*/
  next(new AppError(`Cant find ${req.originalUrl} on the server`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
