import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

function CopyButton() {
  return (
    <div className="hidden rounded border group-hover:flex h-[22px] w-[22px] items-center justify-center bg-muted/50 hover:bg-muted border-border/50 dark:border-border/50 absolute right-3 top-3 z-10">
      <button
        type="button"
        className="relative cursor-pointer flex h-full w-full items-center justify-center hover:bg-muted/70 rounded-[4px] transition-colors"
        aria-label="Copy to clipboard"
      >
        <div className="relative text-[12px] leading-[normal] p-[1px] h-3.5 w-3.5 text-foreground/70 hover:text-foreground">
          <svg
            aria-hidden="true"
            focusable="false"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <path
              fill="currentColor"
              d="M64 464H288c8.8 0 16-7.2 16-16V384h48v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h64v48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16zM224 304H448c8.8 0 16-7.2 16-16V64c0-8.8-7.2-16-16-16H224c-8.8 0-16 7.2-16 16V288c0 8.8 7.2 16 16 16zm-64-16V64c0-35.3 28.7-64 64-64H448c35.3 0 64 28.7 64 64V288c0 35.3-28.7 64-64 64H224c-35.3 0-64-28.7-64-64z"
            ></path>
          </svg>
        </div>
      </button>
    </div>
  );
}

export function Input({ input, label }: { input: string; label?: string }) {
  return (
    <div className="space-y-2">
      <Label>Input</Label>
      <Card className="group relative overflow-hidden border border-border/50 bg-muted/30 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-muted/50">
        <div className="relative py-3 px-3">
          <CopyButton />
          {label && (
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              {label}
            </div>
          )}
          <div className="font-mono whitespace-pre-wrap break-all leading-6 text-foreground select-all">
            {input}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function CustomInput({
  input,
  onChange
}: {
  input: string;
  onChange: (value: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="custom-input">Input</Label>
      <Card className="group relative overflow-hidden border border-border/50 bg-muted/30 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-muted/50">
        <div className="relative py-3 px-3">
          <Textarea
            id="custom-input"
            value={input}
            onChange={handleChange}
            placeholder="Enter custom test input..."
            className="font-mono border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 p-0 resize-none min-h-[60px] shadow-none"
          />
        </div>
      </Card>
    </div>
  );
}

export function CustomInputResult({ result }: { result: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-output">Output</Label>
      <Card className="group relative overflow-hidden border border-border/50 bg-muted/30 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-muted/50">
        <div className="relative py-3 px-3">
          <Textarea
            id="custom-output"
            value={result}
            readOnly
            disabled
            className="font-mono border-0 bg-transparent focus-visible:outline-none focus-visible:ring-0 p-0 resize-none min-h-[60px] shadow-none text-muted-foreground cursor-not-allowed"
          />
        </div>
      </Card>
    </div>
  );
}

export function Expected({ expected }: { expected: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor="expected-output" className="text-sm font-medium text-foreground block">
        Expected Output
      </label>
      <Card id="expected-output" className="group relative overflow-hidden border border-border/50 bg-muted/30 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-muted/50">
        <div className="relative py-3 px-3">
          <CopyButton />
          <div className="font-mono whitespace-pre-wrap break-all leading-6 text-foreground select-all">
            {expected}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function Output({ output }: { output: string }) {
  return (
    <div className="space-y-2">
      <label htmlFor="output" className="text-sm font-medium text-foreground block">
        Output
      </label>
      <Card id="output" className="group relative overflow-hidden border border-border/50 bg-muted/30 backdrop-blur-sm transition-all hover:border-border/80 hover:bg-muted/50">
        <div className="relative py-3 px-3">
          <CopyButton />
          <div className="font-mono whitespace-pre-wrap break-all leading-6 text-foreground select-all">
            {output}
          </div>
        </div>
      </Card>
    </div>
  );
}
