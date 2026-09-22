import { colors } from "@/common/colors";
import { WSMarkdown } from "@/common/components/ws-markdown";
import { darkModeSelector } from "@/common/processor-utils";
import { DEVICE } from "@/common/style-constants";
import React from "react";
import remarkGfm from "remark-gfm";
import styled from "styled-components";

const Page = styled.div`
  flex: 1 1 auto;
  padding: 24px 20px 48px;

  @media ${DEVICE.tablet} {
    padding: 32px 40px 64px;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Policy = styled(WSMarkdown)`
  max-width: 840px;
  margin: 0 auto;
  color: ${colors.text};

  table {
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  th,
  td {
    border: 1px solid ${colors.divider};
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }

  ${darkModeSelector(`
    color: ${colors.textDark};

    th, td {
      border-color: ${colors.disabledText};
    }
  `)}
`;

const markdownComponents = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  table: ({ node, ...props }) => (
    <TableWrapper>
      <table {...props} />
    </TableWrapper>
  ),
};

type PrivacyPolicyPageProps = {
  content: string;
};

export const PrivacyPolicyPage = ({
  content,
}: PrivacyPolicyPageProps): JSX.Element => {
  return (
    <Page>
      <Policy remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </Policy>
    </Page>
  );
};
