import styled from "styled-components";

type AuthButtonProps = {
  src: string;
};

export const AuthButton = styled.a<AuthButtonProps>`
  display: inline-block;
  width: 200px;
  height: 49px;
  cursor: pointer;
  opacity: 1;
  text-decoration: none;
  transition: opacity 200ms;
  background-image: url(${({ src }: AuthButtonProps) => src});
  background-size: contain;
  background-repeat: no-repeat;
  &:hover {
    opacity: 0.8;
    text-decoration: none;
  }
`;
