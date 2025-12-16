import express from "express";
import { fetchAllInterns } from "../controllers/rawSQLclient.Controller.js";

const router = express.Router();

router.get("/fetchAllInterns", fetchAllInterns);
export default router;
