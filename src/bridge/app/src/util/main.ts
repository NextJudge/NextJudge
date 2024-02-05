import { User } from "@util/types";
import jwt from "jsonwebtoken";

export const isValidToken = async (
  token: string,
  userId: string
): Promise<[boolean, User | null]> => {
  try {
    const tokenIdentity = (await validateToken(token)) as User;
    const user = JSON.parse(JSON.stringify(tokenIdentity)).user as User;
    if (user.id !== parseInt(userId)) {
      return [false, null];
    }
    return [true, user];
  } catch (error) {
    console.error("An error occurred while validating the token:", error);
    throw error;
  }
};

export const validateToken = async (token: string): Promise<any> => {
  try {
    const decoded = jwt.verify(token, "secret");
    return decoded;
  } catch (error) {
    throw error;
  }
};
