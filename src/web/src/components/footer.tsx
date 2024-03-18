import { Pyramid } from "lucide-react";
export const Footer = () => {
  return (
    <footer id="footer">
      <hr className="w-11/12 mx-auto" />

      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full xl:col-span-2">
          <a href="/" className="font-bold text-xl flex">
            <Pyramid size={24} className="text-orange-600" />
            <span className="ml-2">NextJudge</span>
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Docs</h3>
          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              Getting Started
            </a>
          </div>

          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              API Reference
            </a>
          </div>

          <div>
            <a
              href="https://github.com/nextjudge"
              rel="noopener noreferrer"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">NextJudge</h3>
          <div>
            <a href="#services" className="opacity-60 hover:opacity-100">
              Services
            </a>
          </div>

          <div>
            <a href="#features" className="opacity-60 hover:opacity-100">
              Features
            </a>
          </div>

          <div>
            <a href="#early-access" className="opacity-60 hover:opacity-100">
              Early Access
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Platform</h3>
          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              Home
            </a>
          </div>

          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              Problem Set
            </a>
          </div>

          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              Contests
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Community</h3>
          <div>
            <a
              href="https://github.com/nextjudge"
              rel="noopener noreferrer"
              target="_blank"
              className="opacity-60 hover:opacity-100"
            >
              GitHub
            </a>
          </div>

          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              Our Team
            </a>
          </div>

          <div>
            <a href="#" className="opacity-60 hover:opacity-100">
              Contact
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>
          &copy; 2024{" "}
          <a
            target="_blank"
            href="https://github.com/nextjudge/nextjudge"
            className="text-orange-600 transition-all border-primary hover:border-b-2"
          >
            NextJudge
          </a>
        </h3>
      </section>
    </footer>
  );
};
