import { SUBSTATION_FONT_LIST } from "./src/common/substation-fonts";
import fs from "fs";
import path from "path";

fs.writeFileSync(
  path.join("public", "fontlist.json"),
  JSON.stringify(SUBSTATION_FONT_LIST, null, 2)
);
