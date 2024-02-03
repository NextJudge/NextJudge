import bearer from "@elysiajs/bearer";
import UserService from "../UserService";
import jwt from "jsonwebtoken";

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
  body: { username, password },
}: {
  bearer: string;
  body: { username: string; password: string };
}) => {
  try {
    const decoded = jwt.verify(bearer, "secret");
    if (decoded) {
      return await userService.createUser(username, password);
    }
  } catch (error) {
    console.error("An error occurred while creating the user:", error);
    throw error;
  }
};

export const authorizeUser = async (token: string) => {
  try {
    return await userService.validateToken(token);
  } catch (error) {
    console.error("An error occurred while validating the token:", error);
    throw error;
  }
};
