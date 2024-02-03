import jwt from "jsonwebtoken";
import { ApiResponse, User, UserValidationResult } from "../types";
import ApiService from "./ApiService";

const databasePort = process.env.DATABASE_PORT;

class UserService {
  private users: User[] = [];
  static mockUsers: User[] = [
    {
      id: 1,
      username: "test",
      password_hash: "test",
      join_date: new Date().toString(),
    },
  ];
  private numberOfUsers: number = 0;

  async getUsers() {
    try {
      console.log("[UserService] Getting users");
      const response = await ApiService.get(`http://localhost:${databasePort}/v1/users`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      this.users = (await response.json()) as ApiResponse;
      this.numberOfUsers = this.users.length;
      return this.users;
    } catch (error) {
      console.error("An error occurred while getting the users:", error);
      throw error;
    }
  }

  async createUser(username: string, password: string) {
    try {
      console.log("[UserService] Creating user");

      const users = await this.getUsers();
      const userExists = users.find((user: User) => user.username === username);

      if (
        (userExists && users.length >= 1 && users[0].username === username) ||
        users[1]?.username === username
      )
        throw new Error("User already exists");

      const hashedPassword = await Bun.password.hash(password);
      const response = await ApiService.post(`http://localhost:${databasePort}/v1/users`, {
        username,
        password_hash: hashedPassword,
        join_date: new Date(),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const user = await this.getUsers();
      const userToReturn = user.find(
        (user: User) => user.username === username
      );
      return { user: userToReturn };
    } catch (error) {
      console.error("An error occurred while creating the user:", error);
      throw error;
    }
  }

  async authenticateUser(username: string, password: string) {
    console.log("[UserService] Authenticating user");
    const response = await ApiService.get(`http://localhost:${databasePort}/v1/users`);
    let users = (await response.json()) as ApiResponse;
    const { user, isCorrectUser }: any = await this.isCorrectUser(
      users,
      username,
      password
    );
    if (!isCorrectUser) throw new Error("Invalid username or password");
    const token = jwt.sign({ user }, "secret");
    return { token };
  }

  async validateToken(token: string) {
    try {
      const decoded = jwt.verify(token, "secret");
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  async isCorrectUser(
    users: User[],
    username: string,
    password: string
  ): Promise<UserValidationResult> {
    const user = users.find((user: User) => user.username === username);
    if (!user) return { user: null, isCorrectUser: false };
    try {
      let status = await Bun.password.verify(password, user.password_hash);
      return { user: user, isCorrectUser: status };
    } catch (error) {
      return { user: user, isCorrectUser: false };
    }
  }
}

export default UserService;
