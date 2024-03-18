import { useCallback, useRef, useState } from "react";
import { ImperativePanelHandle } from "react-resizable-panels";

export const useEditorCollapse = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const ref = useRef<ImperativePanelHandle>(null);

  const collapse = useCallback(() => {
    if (ref.current) {
      ref.current.collapse();
      setIsCollapsed(true);
    }
  }, [ref]);

  const expand = useCallback(() => {
    if (ref.current) {
      ref.current.expand();
      setIsCollapsed(false);
    }
  }, [ref]);

  return { isCollapsed, ref, collapse, expand };
};
