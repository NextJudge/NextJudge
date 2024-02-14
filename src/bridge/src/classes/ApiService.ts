class ApiService {
  static async get(url: string): Promise<Response> {
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  static async post(url: string, body: object): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  static async patch(url: string, body: object): Promise<Response> {
    return fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
}

export default ApiService;
