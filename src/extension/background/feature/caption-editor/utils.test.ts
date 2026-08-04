import { CaptionFileFormat } from "@/common/types";
import { decompressFromBase64 } from "lz-string";
import { describe, expect, it } from "vitest";
import { compressRawCaptionForUpload } from "./utils";

describe("compressRawCaptionForUpload", () => {
  it("returns nothing when there is no raw caption", () => {
    expect(compressRawCaptionForUpload(undefined)).toBeUndefined();
  });

  it("returns nothing when the raw caption has no data", () => {
    // Captions written in the editor have no raw file behind them. Sending a
    // raw caption here makes the server reject the whole submission because it
    // cannot store an empty raw file
    expect(
      compressRawCaptionForUpload({ type: CaptionFileFormat.ass, data: "" }),
    ).toBeUndefined();
  });

  it("compresses the data of a raw caption", () => {
    const data = "[Script Info]\nScriptType: v4.00+\n";
    const result = compressRawCaptionForUpload({
      type: CaptionFileFormat.ass,
      data,
    });
    expect(result?.type).toEqual(CaptionFileFormat.ass);
    expect(result?.data).not.toEqual(data);
    expect(decompressFromBase64(result?.data || "")).toEqual(data);
  });

  it("does not modify the raw caption it is given", () => {
    const rawCaption = { type: CaptionFileFormat.ass, data: "some data" };
    compressRawCaptionForUpload(rawCaption);
    expect(rawCaption.data).toEqual("some data");
  });
});
