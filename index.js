import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./config/db.js";
import { connectMongoDB } from "./config/db_mongo.js";
import authRoute from "./routes/authRoute.js";
import competitionRoute from "./routes/competitionRoute.js";
import teamLeaderRoute from "./routes/teamLeaderRoute.js";
import roleRoute from "./routes/roleRoute.js";
import teamRoute from "./routes/teamRoute.js";
import memberRoute from "./routes/memberRoute.js";
import registrationRoute from "./routes/registrationRoute.js";
import competitionStageRoute from "./routes/competitionStageRoute.js";
import stageSubmissionRoute from "./routes/stageSubmissionRoute.js";
import competitionStageInfoRoute from "./routes/competitionStageInfoRoute.js";
import discountCodeRoute from "./routes/discountCodeRoute.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Test database SQL connection
async function testDBConnection() {
  try {
    await db.query("SELECT 1");
    console.log("✅ Database SQL connected successfully!");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to the database:", error.message);
    return false;
  }
}

testDBConnection();
//

// Test database MongoDB connection
connectMongoDB();
//

app.get("/", (req, res) => {
  res.send("Welcome to the OilWeek 2026 API");
});

app.use(authRoute);
app.use(teamLeaderRoute);
app.use(competitionRoute);
app.use(roleRoute);
app.use(teamRoute);
app.use(memberRoute);
app.use(registrationRoute);
app.use(competitionStageRoute);
app.use(stageSubmissionRoute);
app.use(competitionStageInfoRoute);
app.use(discountCodeRoute);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
