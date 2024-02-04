import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Error from "./components/error";
import RootLayout from "./components/root-layout";
import Auth from "./routes/auth";
import EarlyAcess from "./routes/early-access";
import Home from "./routes/home";
import Problem from "./routes/problem";
import Problems from "./routes/problems";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <Error />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/auth",
        element: <Auth />,
      },
      {
        path: "/problems",
        element: <Problems />,
      },
      {
        path: "/problem/:id",
        element: <Problem />,
      },
      {
        path: "/early-access",
        element: <EarlyAcess />,
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
