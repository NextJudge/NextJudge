import type { Monaco } from "@monaco-editor/react";

import { MONACO_NODE_STUBS } from "./monaco-node-stubs";

let configured = false;

export const configureMonacoTypeScript = (monaco: Monaco): void => {
  if (configured) {
    return;
  }
  configured = true;

  const compilerOptions = {
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowJs: true,
    checkJs: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  };

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions(compilerOptions);
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    allowJs: true,
    checkJs: true,
  });
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    MONACO_NODE_STUBS,
    "monaco-node-stubs.d.ts",
  );
};
