import { SUBSTATION_GROUPED_FONTS } from "@/common/substation-fonts";
import { Col, Row } from "antd";
import Text from "antd/lib/typography/Text";
import { startCase } from "lodash-es";
import React from "react";
import Link from "antd/lib/typography/Link";
import styled, { CSSProperties } from "styled-components";
import { colors } from "@/common/colors";
import { useTranslation } from "next-i18next";

export type FontGroup = keyof typeof SUBSTATION_GROUPED_FONTS;

export type PreviewLoadState = "loading" | "loaded" | "idle";

export type FontItemType = {
  fontName: string;
  url: string;
  group: FontGroup;
};

export type FontItemProps = FontItemType & {
  showPreview: boolean;
  onTogglePreview: (font: FontItemType) => void;
  isLoadingPreview: boolean;
  fontSize: number;
  style?: CSSProperties;
};

const FontRow = styled(Row)`
  &.ant-row {
    width: 100%;
    padding: 16px 20px;
    background: ${colors.white};
    border-bottom: 1px solid #0f0f0f05;
  }
`;

const PREVIEW_TEXT: {
  [id in keyof typeof SUBSTATION_GROUPED_FONTS]: string;
} = {
  latin:
    "A foxy, quick, clever cat in Switzerland was hit by a fancy sports job with bumpy seats and a grumpy driver.",
  japanese: `荒む気温
    後に猫へ生まれ変わり
    愛してもらえると
    ロクな夢を見ぬ夜は更け
    痩せ細った日`,
  simplifiedChinese: "不管黑猫白猫，捉到老鼠就是好猫。",
  traditionalChinese: "不管黑貓白貓，捉到老鼠就是好貓。",
  korean: "키스의 고유조건은 입술끼리 만나야 하고 특별한 기술은 필요치 않다",
  arabic: "نص حكيم له سر قاطع وذو شأن عظيم مكتوب على ثوب أخضر ومغلف بجلد أزرق",
  thai: `เป็นมนุษย์สุดประเสริฐเลิศคุณค่า 
    กว่าบรรดาฝูงสัตว์เดรัจฉาน 
    จงฝ่าฟันพัฒนาวิชาการ 
    อย่าล้างผลาญฤๅเข่นฆ่าบีฑาใคร 
    ไม่ถือโทษโกรธแช่งซัดฮึดฮัดด่า 
    หัดอภัยเหมือนกีฬาอัชฌาสัย 
    ปฏิบัติประพฤติกฎกำหนดใจ 
    พูดจาให้จ๊ะ ๆ จ๋า ๆ น่าฟังเอยฯ`,
  vietnamese: "Do bạch kim rất quý nên sẽ dùng để lắp vô xương",
  devanagari: "अंतरिक्ष यान से दूर नीचे पृथ्वी शानदार ढंग से जगमगा रही थी ।",
  gujarati:
    "મેં બિલાડીઓને સંડોવતા એક સરસ વાક્ય શોધવાનો પ્રયાસ કર્યો. હું નિષ્ફળ ગયો. આનો અર્થ કદાચ નથી.",
  cyrillic: "Съешь же ещё этих мягких французских булок, да выпей чаю.",
  greek: "Ζαφείρι δέξου πάγκαλο, βαθῶν ψυχῆς τὸ σῆμα.",
};

export const FontItem = ({
  fontName,
  group,
  url,
  showPreview = false,
  isLoadingPreview,
  onTogglePreview,
  fontSize = 16,
  style,
}: FontItemProps): JSX.Element => {
  const { t } = useTranslation("common");
  const displayName = startCase(fontName);
  const handleTogglePreview = async () => {
    onTogglePreview({
      fontName,
      group,
      url,
    });
  };
  return (
    <FontRow style={{ ...style }}>
      <Col span={3}>
        <Text>{displayName}</Text>
      </Col>
      <Col span={2}>
        <Link onClick={handleTogglePreview}>
          {showPreview ? t("fontlist.hidePreview") : t("fontlist.preview")}
        </Link>
      </Col>
      <Col span={19} style={{ direction: group === "arabic" ? "rtl" : "ltr" }}>
        {showPreview && (
          <Text
            style={{
              fontSize: fontSize,
              fontFamily: `"${displayName}", sans-serif`,
            }}
          >
            {!isLoadingPreview && PREVIEW_TEXT[group]}
            {isLoadingPreview && t("common.loading")}
          </Text>
        )}
      </Col>
    </FontRow>
  );
};
