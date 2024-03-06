import { DATABASE_HOST, DATABASE_PORT } from "@util/constants";
import ApiService from "@classes/ApiService";

export default async function getLanguages() {
  
  const response = await ApiService.get(
    `http://${DATABASE_HOST}:${DATABASE_PORT}/v1/languages`,
  );

  return await response.json()
}
