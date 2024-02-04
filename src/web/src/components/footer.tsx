export default function Footer() {
  return (
    <>
      <footer className="container mt-32 flex items-center justify-start px-4 lg:px-6">
        <span className="flex items-center space-x-2">
          &copy; &nbsp;
          <span>{new Date().getFullYear()}</span>
          <a
            href="https://github.com/NextJudge"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 duration-200 hover:text-white hover:underline"
          >
            NextJudge
          </a>
        </span>
      </footer>
    </>
  );
}
