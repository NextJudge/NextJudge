import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type Response = {
  status: string;
  url?: string;
};

export default function EarlyAcess() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const FORM_URL = `https://app.convertkit.com/forms/6158230/subscriptions`;

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setEmail(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    try {
      const response = await fetch(FORM_URL, {
        method: "POST",
        body: data,
        headers: {
          accept: "application/json",
        },
      });

      console.log(response);

      setEmail("");
      const json = (await response.json()) as Response;

      if (json.status === "success" || json.status === "quarantined") {
        setStatus("SUCCESS");
        setRedirectUrl(json.url || null);
        return;
      }
    } catch (err) {
      setStatus("ERROR");
      setRedirectUrl(null);
      console.log(err);
    }
  };

  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  return (
    <>
      <main className="layout h-screen w-full overflow-x-hidden bg-black bg-fixed text-white selection:bg-white selection:text-black">
        <img
          src="/react.svg"
          alt="React.js logo"
          height={150}
          width={150}
          className="absolute left-0 m-6 max-w-[30px] animate-[spin_5s_linear_infinite]"
        />
        <section className="container px-4 py-6 pt-24 md:px-6">
          <div className="mx-auto max-w-2xl space-y-6 p-4">
            <h1 className="relative z-10 bg-gradient-to-b from-purple-600 to-blue-600 bg-clip-text text-center text-5xl font-bold tracking-tighter text-transparent md:text-7xl">
              Get Early Access
            </h1>
            <p></p>
            <p className="relative z-10 mx-auto my-2 max-w-xl px-4 text-center text-lg text-neutral-300 lg:text-xl">
              Sign up to get early access to our platform. We will notify you
              when we are ready to launch. <br /> In the meantime, check out our
              <a
                href="/"
                className="bg-gradient-to-r from-purple-600/70 to-blue-600/70 bg-clip-text text-transparent"
              >
                {" "}
                landing page
              </a>
              .
            </p>
            <div>
              {status === "SUCCESS" && (
                <div className="my-24 text-center text-xl text-neutral-200 md:text-3xl">
                  <p>Thanks for signing up! 🎉</p>
                  <p>We will notify you when we are ready to launch.</p>

                  <button
                    onClick={() => navigate("/")}
                    className="mt-8 hover:underline"
                  >
                    Go Back
                  </button>
                </div>
              )}
              {status === "ERROR" && (
                <>
                  <p>Oops, something went wrong...</p>
                  <p>
                    Please,{" "}
                    <button onClick={() => setStatus(null)}>try again.</button>
                  </p>
                </>
              )}
              {status === null && (
                <form onSubmit={handleSubmit} className="mx-auto w-full">
                  <input
                    aria-label="Your email address"
                    name="email_address"
                    placeholder="Your email address"
                    required
                    className="relative mt-4 w-full rounded-lg  border border-neutral-800 bg-neutral-950 px-2  py-4 placeholder:text-neutral-700 focus:ring-2 focus:ring-teal-500"
                    type="email"
                    onChange={handleEmailChange}
                    value={email}
                  />

                  <button
                    type="submit"
                    className="my-8 w-full rounded-lg bg-gradient-to-r from-purple-600/50 to-blue-600/50 py-4 text-lg font-medium text-white transition-all hover:from-purple-600/70 hover:to-blue-600/70 focus:ring-2 focus:ring-teal-500"
                  >
                    <span className="text-lg font-medium text-white">
                      Sign Up
                    </span>
                  </button>
                </form>
              )}
            </div>
            <div className=" mx-auto mt-8 sm:w-[500px] lg:mt-12 lg:w-[900px] lg:-translate-x-28">
              <img
                src="/preview.png"
                alt="App preview"
                className="inset-0 box-border h-auto w-full rounded-lg border-4 border-white/5 bg-gradient-to-r from-purple-600/70 to-blue-600/70 object-cover shadow-2xl "
              />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
