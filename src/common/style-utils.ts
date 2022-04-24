import styled, { ThemedStyledFunction } from "styled-components";

// Should not use this for nextjs pages as it leads to mismatches during ssr.
// Use withConfig directly instead
export const styledNoPass = <
  O extends Record<string, unknown>,
  C extends keyof JSX.IntrinsicElements | React.ComponentType<any> = "div"
>(
  type: C,
  displayName: string
): ThemedStyledFunction<C, any, O, never> => {
  return styled(type).withConfig<O>({
    shouldForwardProp: (prop, defPropValFn) => defPropValFn(prop),
    displayName,
  });
};
