import ApiService from "@classes/ApiService";
import { DATABASE_PORT, DATABASE_HOST } from "@util/constants";
import { ApiResponse, User, UserValidationResult } from "@util/types";
import jwt from "jsonwebtoken";

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
      const response = await ApiService.get(
        `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/users`
      );
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

  async createUser(username: string, password: string, isAdmin: true | false) {
    try {
      console.log("[UserService] Creating user");

      const hashedPassword = await Bun.password.hash(password);
      const response = await ApiService.post(
        `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/users`,
        {
          username,
          password_hash: hashedPassword,
          join_date: new Date(),
          is_admin: isAdmin,
          email: "example@example.com",
          name: "bob"
        }
      );
      if (!response.ok) throw new Error(`User already exists!`);
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
    const response = await ApiService.get(
      `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/users`
    );
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
