import {
  EXCLUDED_FONTS,
  SUBSTATION_GROUPED_FONTS,
} from "@/common/substation-fonts";
import { Slider, Input } from "antd";
import FontSizeOutlined from "@ant-design/icons/FontSizeOutlined";
import Title from "antd/lib/typography/Title";
import { omit, startCase } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "antd/lib/typography/Link";
import styled from "styled-components";
import { colors } from "@/common/colors";
import {
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
  List,
  ListRowProps,
} from "react-virtualized";
import "react-virtualized/styles.css";
import { FontItem, FontItemType } from "./font-item";
import { useTranslation } from "next-i18next";

const MAX_CONCURRENT_FONT_DOWNLOADS = 3;

type FontVirtualizedRow =
  | {
      type: "font";
      font: FontItemType;
    }
  | {
      type: "group";
      name: string;
    };

const FontPreviewControl = styled.div`
  display: flex;
  flex-direction: row;
  grid-column-gap: 8px;
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 16px;
  padding: 0px 40px;
  height: 100%;
  flex-grow: 1;
`;

export const FontListPage = (): JSX.Element => {
  const fontList: typeof SUBSTATION_GROUPED_FONTS = Object.keys(
    SUBSTATION_GROUPED_FONTS
  ).reduce((acc, groupName) => {
    // Prepend the fonts url to the font list
    const group = SUBSTATION_GROUPED_FONTS[groupName];
    return {
      ...acc,
      [groupName]: Object.keys(group).reduce((fontsAcc, fontKey) => {
        const fontPath = group[fontKey];
        const newPath = fontPath.startsWith("/")
          ? `${process.env.NEXT_PUBLIC_FONTS_URL.replace(
              /\/+$/,
              ""
            )}${fontPath}`
          : fontPath;
        return {
          ...fontsAcc,
          [fontKey]: newPath,
        };
      }, {}),
    };
  }, {}) as typeof SUBSTATION_GROUPED_FONTS;
  const { t } = useTranslation("common");
  const [searchString, setSearchString] = useState("");
  const [showPreview, setShowPreview] = useState<{ [id: string]: boolean }>(
    () => {
      const initialState: { [id: string]: boolean } = {};
      Object.keys(fontList).forEach((group) => {
        Object.keys(SUBSTATION_GROUPED_FONTS[group])
          .filter((name) => EXCLUDED_FONTS.indexOf(name.toLowerCase()) < 0)
          .forEach((name) => {
            initialState[name] = false;
          });
      });
      return initialState;
    }
  );

  const [fontSize, setFontSize] = useState(16);

  const listRows = useMemo<FontVirtualizedRow[]>(() => {
    const rows: FontVirtualizedRow[] = [];
    Object.keys(fontList).forEach(
      (group: keyof typeof SUBSTATION_GROUPED_FONTS) => {
        rows.push({
          type: "group",
          name: group,
        });
        Object.keys(fontList[group])
          .filter((name) => {
            if (EXCLUDED_FONTS.indexOf(name.toLowerCase()) >= 0) {
              return false;
            }
            if (!!searchString && !name.includes(searchString.toLowerCase())) {
              return false;
            }
            return true;
          })
          .forEach((name) => {
            rows.push({
              type: "font",
              font: {
                fontName: name,
                url: fontList[group][name],
                group,
              },
            });
          });
      }
    );
    return rows;
  }, [fontList, searchString]);

  const fontDataMap = useMemo<{ [id: string]: FontItemType }>(() => {
    return listRows
      .filter((row) => row.type === "font")
      .reduce((acc, row) => {
        if (row.type !== "font") {
          return null;
        }
        acc[row.font.fontName] = row.font;
        return acc;
      }, {});
  }, [listRows]);

  const allShown = useMemo(() => {
    return Object.values(showPreview).every((v) => v);
  }, [showPreview]);

  const cache = useRef<CellMeasurerCache>(
    new CellMeasurerCache({
      defaultHeight: 60,
      fixedWidth: true,
    })
  );
  const downloadedFonts = useRef<Set<string>>(new Set());
  const [fontQueue, setFontQueue] = useState<{ [id: string]: FontItemType }>(
    {}
  );
  const [fontsBeingDownloaded, setFontsBeingDownloaded] = useState<{
    [id: string]: boolean;
  }>({});

  useEffect(() => {
    const fontDownloader = setInterval(() => {
      const fontsToQueue = [];
      // Since we're not updating the queue from the state during the loop,
      // we have to copy the states out and modify them before updating the states all at once.
      const currentQueue = { ...fontQueue };
      const currentFontsBeingDownloaded = { ...fontsBeingDownloaded };
      while (
        Object.keys(currentQueue).length > 0 &&
        Object.keys(currentFontsBeingDownloaded).length <
          MAX_CONCURRENT_FONT_DOWNLOADS
      ) {
        const firstFontNameInQueue = Object.keys(currentQueue)[0];
        const { fontName, url } = currentQueue[firstFontNameInQueue];
        delete currentQueue[firstFontNameInQueue];
        const displayName = startCase(fontName);
        const previewedFont = new FontFace(displayName, `url(${url})`);
        previewedFont
          .load()
          .then((loadedFont) => {
            // @ts-ignore
            document.fonts.add(loadedFont);
            setFontsBeingDownloaded((previousState) =>
              omit(previousState, [fontName])
            );
            downloadedFonts.current.add(fontName);
            cache.current.clearAll();
          })
          .catch((err) => {
            setFontsBeingDownloaded((previousState) =>
              omit(previousState, [fontName])
            );
            console.warn("Failed to download font", err);
          });
        currentFontsBeingDownloaded[fontName] = true;
        fontsToQueue.push(firstFontNameInQueue);
        cache.current.clearAll();
        console.log("Downloading", displayName);
      }
      if (fontsToQueue.length <= 0) {
        return;
      }
      setFontQueue((previousState) => {
        const nextState = omit(previousState, fontsToQueue);
        return nextState;
      });
      setFontsBeingDownloaded((previousState) => ({
        ...previousState,
        ...fontsToQueue.reduce((acc, fontName) => {
          acc[fontName] = true;
          return acc;
        }, {}),
      }));
    }, 100);
    return () => {
      clearInterval(fontDownloader);
    };
  }, [fontList, downloadedFonts, fontQueue, fontsBeingDownloaded]);

  const queueFontForDownload = (font: FontItemType) => {
    const { fontName } = font;
    if (downloadedFonts.current.has(font.fontName)) {
      return;
    }
    fontQueue[fontName] = font;
    setFontQueue({ ...fontQueue });
  };

  const handleToggleSingleFontPreview = (font: FontItemType) => {
    const { fontName } = font;
    const shouldShowNow = !showPreview[fontName];
    if (shouldShowNow) {
      queueFontForDownload(font);
    }
    setShowPreview((prevState) => ({
      ...prevState,
      [fontName]: shouldShowNow,
    }));
    cache.current.clearAll();
  };

  const handleToggleAllPreviews = useCallback(() => {
    const newPreviewState = allShown ? false : true;
    const newState = Object.keys(showPreview).reduce((acc, fontName) => {
      const fontData = fontDataMap[fontName];
      if (fontData) {
        queueFontForDownload(fontData);
      }
      acc[fontName] = newPreviewState;
      return acc;
    }, {});
    setShowPreview(newState);
  }, [allShown, fontDataMap, fontQueue]);
  const handleChangeFontSize = (value) => {
    setFontSize(value);
    cache.current.clearAll();
  };

  const onChangeSearch = (e) => {
    setSearchString(e.target.value);
  };

  const noTextRowRenderer = () => {
    return (
      <div>
        <div>{t("fontlist.noFonts")}</div>
      </div>
    );
  };

  const fontRowRenderer = ({ key, style, index, parent }: ListRowProps) => {
    const row = listRows[index];
    return (
      <CellMeasurer
        cache={cache.current}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        {row.type === "group" && (
          <div
            style={{
              ...style,
              padding: "20px 20px",
              backgroundColor: colors.white,
              borderBottom: `1px solid #0f0f0f11`,
            }}
          >
            <Title level={4} key={key}>
              {startCase(row.name)}
            </Title>
          </div>
        )}
        {row.type === "font" && (
          <FontItem
            key={key}
            fontName={row.font.fontName}
            group={row.font.group}
            url={fontList[row.font.group][row.font.fontName]}
            showPreview={showPreview[row.font.fontName]}
            fontSize={fontSize}
            onTogglePreview={handleToggleSingleFontPreview}
            isLoadingPreview={
              fontsBeingDownloaded[row.font.fontName] ||
              !!fontQueue[row.font.fontName]
            }
            style={{ ...style }}
          />
        )}
      </CellMeasurer>
    );
  };

  return (
    <Page>
      <Title level={2}>{t("fontlist.availableFonts")}</Title>
      <div
        style={{
          padding: "20px",
          position: "sticky",
          top: 64,
          marginBottom: "20px",
          backgroundColor: colors.white,
          zIndex: 2,
        }}
      >
        <FontPreviewControl>
          <Link onClick={handleToggleAllPreviews}>
            {allShown
              ? t("fontlist.hideAllFontPreviews")
              : t("fontlist.previewAllFonts")}
          </Link>
          {!allShown && t("fontlist.largeFontDownloadWarning")}
        </FontPreviewControl>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <div style={{ marginRight: 20 }}>
            <Input
              placeholder={t("fontlist.searchFont")}
              allowClear
              onChange={onChangeSearch}
            ></Input>
          </div>
          <FontSizeOutlined />
          <Slider
            style={{ width: "200px" }}
            value={fontSize}
            onChange={handleChangeFontSize}
          />
        </div>
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <AutoSizer>
          {({ width, height }) => (
            <List
              height={height}
              width={width}
              rowCount={listRows.length}
              rowHeight={cache.current?.rowHeight || 0}
              overscanRowCount={5}
              noRowsRenderer={noTextRowRenderer}
              rowRenderer={fontRowRenderer}
            />
          )}
        </AutoSizer>
      </div>
    </Page>
  );
};
