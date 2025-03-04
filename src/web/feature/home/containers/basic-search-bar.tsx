import { searchFromBasicBar } from "@/common/feature/search/actions";
import { styledNoPass } from "@/common/style-utils";
import SearchOutlined from "@ant-design/icons/SearchOutlined";
import { Button, Form, Input } from "antd";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

type SearchRowProps = {
  opened?: boolean;
};

const SearchRow = styledNoPass<SearchRowProps>("div", "SearchRow")`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;

  input {
      width: ${({ opened }) => (opened ? "100%" : "0px")};
      padding-left: ${({ opened }) => (opened ? "11px" : "0px")};
      padding-right: ${({ opened }) => (opened ? "11px" : "0px")};
      opacity: ${({ opened }) => (opened ? "1" : "0")};
      transition: width 300ms ease-out, padding-left 300ms ease-out, padding-right 300ms ease-out;
  }

  > *:not(:last-child) {
    margin-right: 8px;
  }
`;

type BasicSearchForm = {
  title: string;
};

export const BasicSearchBar = ({
  forceOpen = false,
  onSearch: onSearchExternal,
}: {
  forceOpen?: boolean;
  onSearch?: () => void;
}) => {
  const { control, handleSubmit } = useForm<BasicSearchForm>();
  const dispatch = useDispatch();
  const [opened, setOpened] = useState(false);
  const { t } = useTranslation("common");

  const onSearch = (form: BasicSearchForm) => {
    if (onSearchExternal) {
      onSearchExternal();
    }
    dispatch(searchFromBasicBar(form.title));
  };

  const openSearch = () => {
    setOpened(true);
  };

  const actuallyOpened = forceOpen || opened;

  const handleClickSearch = actuallyOpened
    ? handleSubmit(onSearch)
    : openSearch;

  return (
    <div>
      <Form onSubmitCapture={handleClickSearch}>
        <SearchRow opened={actuallyOpened}>
          {
            <Controller
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t("home.search.inputPlaceholder")}
                  style={{ fontSize: "15px" }}
                />
              )}
              control={control}
              name="title"
              defaultValue={""}
              rules={{
                required: true,
              }}
            />
          }
          <Button htmlType={"submit"}>
            <SearchOutlined style={{ fontSize: "16px" }} />
          </Button>
        </SearchRow>
      </Form>
    </div>
  );
};
