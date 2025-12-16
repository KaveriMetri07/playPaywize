import axios from "axios";

import logger from "../logger/index.loger.js";

const rawSQL_BaseUrl = "http://localhost:3001/api";

export const getAllInternsFrom_RawSQL = async (token) => {
  try {
    const response = await axios.get(`${rawSQL_BaseUrl}/getAllInterns`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });
    console.log("successfully hit the rawSQL SERVICES",response.data)
    return response.data;
  } catch (error) {
    logger.error("error From rawSQL client", { error: error });
    throw new Error("failed to fetch from interns from rawSQl");
  }
};
