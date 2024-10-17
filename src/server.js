// server.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const routes = require("./routes");


const app = express();
const PORT = process.env.PORT || 8000;

app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: process.env.BASE_URL }));
app.use(routes);
app.use(express.static("public"));
app.use(cookieParser());

app.listen(PORT, () => console.log(`Server running on port ${PORT}!`));
