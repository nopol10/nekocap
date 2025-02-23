import styled from "styled-components";
import { DEVICE } from "../style-constants";

export const Badges = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;

  & > a {
    margin-bottom: 16px;
  }

  @media ${DEVICE.tablet} {
    flex-direction: row;

    & > a:not(:last-child) {
      margin-bottom: 0;
      margin-right: 8px;
    }
  }

  #chrome-badge {
    width: 200px;
  }

  #discord-badge {
    width: 188px;
  }
`;
