import { validateToken } from "@util/main";
import jwt from "jsonwebtoken";
import UserService from "../classes/UserService";

const userService = new UserService();

// Where do want bearer token to be used..and how? 0.o
export const getUsers = async ({ bearer }: { bearer: string }) => {
  try {
    return await userService.getUsers();
  } catch (error) {
    console.error("An error occurred while getting users:", error);
    throw error;
  }
};

export const loginUser = async ({
  body: { username, password },
}: {
  body: { username: string; password: string };
}) => {
  try {
    return await userService.authenticateUser(username, password);
  } catch (error) {
    console.error("An error occurred while authenticating the user:", error);
    throw error;
  }
};

export const createUser = async ({
  bearer,
  body: { username, password, isAdmin },
}: {
  bearer: string;
  body: { username: string; password: string; isAdmin: boolean };
}) => {
  try {
    let decoded = jwt.verify(bearer, "secret");
    decoded = JSON.parse(JSON.stringify(decoded));
    // @ts-ignore
    if (decoded.user.is_admin && isAdmin === true) {
      return await userService.createUser(username, password, true);
      // @ts-ignore
    } else if (decoded.user.is_admin && isAdmin === false) {
      return await userService.createUser(username, password, false);
      // @ts-ignore
    } else if (!decoded.user.is_admin && isAdmin === true) {
      throw new Error("Unauthorized to create an admin user");
    } else {
      return await userService.createUser(username, password, false);
    }
  } catch (error) {
    console.error("An error occurred while creating the user:", error);
    throw error;
  }
};

export const authorizeUser = async (token: string) => {
  try {
    return await validateToken(token);
  } catch (error) {
    console.error("An error occurred while validating the token:", error);
    throw error;
  }
};
