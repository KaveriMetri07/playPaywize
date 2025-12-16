import logger from "../../logger/index.loger.js";
import { getAllInternsFrom_RawSQL } from "../../serviceClients/rawsqlnode.client.js";

export const fetchAllInterns = async (req, res) => {
  try {
    //const token = req.headers.Authorization?.split("")[1];
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Token Missing" });
    }
    const interns = await getAllInternsFrom_RawSQL(token);
    res.json({ msg: "interns fetched successfully", interns });
  } catch (error) {
    logger.error("could not fetch interns", { error });
    res.status(500).json({ msg: "internal error check client" });
  }
};
