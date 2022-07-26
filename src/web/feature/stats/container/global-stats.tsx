import Table from "antd/lib/table/Table";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Card, Col, Row } from "antd";
import styled from "styled-components";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  ResponsiveContainer,
} from "recharts";
import { globalStatsSelector } from "@/common/feature/stats/selectors";
import { languages } from "@/common/languages";
import { CaptionList } from "../../common/components/caption-list";
import { CaptionerFields } from "@/common/feature/captioner/types";
import Text from "antd/lib/typography/Text";

const StatsPage = styled.div`
  margin-top: 40px;
  padding: 0px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ViewText = styled.div`
  font-size: 40px;
`;

const CustomViewTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <Card title={languages[label]}>
        <p>{`${payload[0].value}`}</p>
      </Card>
    );
  }

  return null;
};

const GlobalStats = () => {
  const globalStats = useSelector(globalStatsSelector);

  const fakeUser: CaptionerFields = {
    userId: "",
    name: "",
    nameTag: 0,
    recs: 0,
    languageCodes: [],
    verified: false,
    banned: false,
    lastSubmissionTime: 0,
    profileMessage: "",
    donationLink: "",
    captionCount: 0,
    isReviewer: false,
    isReviewerManager: false,
    isAdmin: true,
  };

  return (
    <StatsPage>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="Total views">
            <ViewText>{globalStats.totalViews.toLocaleString()}</ViewText>
          </Card>
        </Col>
        <Col span={18}>
          <Card title="Total views">
            <ResponsiveContainer width={"100%"} height={300}>
              <BarChart
                data={globalStats.totalViewsPerLanguage}
                margin={{
                  top: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="languageCode" />
                <YAxis dataKey={"views"} />
                <Tooltip content={<CustomViewTooltip />} />
                <Bar dataKey={"views"}></Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Card title={"Top captions of all time"}>
            <CaptionList
              loggedInUser={fakeUser}
              captions={globalStats.topCaptionsAllTime}
              totalCount={globalStats.topCaptionsAllTime.length}
              currentPage={1}
              hideActions={true}
            ></CaptionList>
          </Card>
        </Col>
        <Col span={12}>
          <Card title={"Top captions this month"}>
            <CaptionList
              loggedInUser={fakeUser}
              captions={globalStats.topCaptionsUploadedThisMonth}
              totalCount={globalStats.topCaptionsUploadedThisMonth.length}
              currentPage={1}
              hideActions={true}
            ></CaptionList>
          </Card>
        </Col>
      </Row>
    </StatsPage>
  );
};

export default GlobalStats;
