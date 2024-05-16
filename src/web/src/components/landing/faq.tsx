import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const FAQList: FAQProps[] = [
  {
    question: 'What is "NextJudge"?',
    answer:
      "NextJudge is an all-in-one toolkit for competitive programming. We offer a competitive programming platform (which you're currently on), command-line interface, and backend framework for hosting your own instance of the application stack.",
    value: "item-1",
  },
  {
    question: "How do I get started?",
    answer:
      'To join the platform, simply click on the "Get Started" or "Register" buttons on the top of this page. You can also visit our Github repository to learn more about the project and contribute to the development of NextJudge.',
    value: "item-2",
  },
  {
    question:
      "What are the benefits of using NextJudge over other competitive programming platforms?",
    answer:
      "Unlike other platforms, NextJudge is open-source and extensible. This means that you can host your own instance of the platform, customize it to your needs, and contribute to the development of the project. We also offer a command-line interface and backend framework for building your own competitive programming platform, which no other service offers. ",
    value: "item-3",
  },
  {
    question: "How do I contribute to the development of NextJudge?",
    answer:
      "You can contribute to the development of NextJudge by visiting our Github repository and submitting a pull request. We are always looking for new contributors to help us improve the platform. Although our documentation is a work in progress, contributions are encouraged!",
    value: "item-4",
  },
  {
    question: "How do I become an admin on the platform?",
    answer:
      "To become an admin on the platform, you must first register as a user. Once you have registered, you can request admin access by contacting the NextJudge team. We are always looking for new admins to help us manage the platform and improve the user experience.",
    value: "item-5",
  },
  {
    question: "How do I report a bug or issue with the platform?",
    answer:
      "To report a bug or issue with the platform, you can contact our team directly (hello@nextjudge.org) or submit an issue on our Github repository. We are always looking for feedback on how we can improve the platform and make it better for our users.",
    value: "item-6",
  },
];

export const FAQ = () => {
  return (
    <section id="faq" className="container py-32 max-w-5xl">
      <h2 className="text-3xl md:text-4xl font-medium font-sans mb-4 text-center">
        Frequently Asked{" "}
        <span className="bg-gradient-to-b from-osu to-osu text-transparent bg-clip-text font-serif italic font-semibold">
          Questions
        </span>
      </h2>

      <Accordion type="single" collapsible className="w-full AccordionRoot">
        {FAQList.map(({ question, answer, value }: FAQProps) => (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-left">
              {question}
            </AccordionTrigger>

            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <h3 className="font-medium mt-4">
        Still have questions?{" "}
        <a
          href="mailto:hello@nextjudge.org"
          className="text-primary transition-all border-primary hover:border-b-2"
        >
          Contact us
        </a>
      </h3>
    </section>
  );
};
