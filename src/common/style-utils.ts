import styled, { ThemedStyledFunction } from "styled-components";

export const styledNoPass = <
  O extends Record<string, unknown>,
  C extends keyof JSX.IntrinsicElements | React.ComponentType<any> = "div"
>(
  type: C
): ThemedStyledFunction<C, any, O, never> => {
  return styled(type).withConfig<O>({
    shouldForwardProp: (prop, defPropValFn) => defPropValFn(prop),
  });
};
