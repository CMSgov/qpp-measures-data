import fs from 'fs';
import fse from 'fs-extra';
import { vol } from 'memfs';
import * as updateProgramNames from './update-program-names';
import { mockMvpJson } from '../index.spec';

describe("updateProgramNames", () => {
  it("updates the program-names json with any newly-found programs.", () => {
    const writeSpy = jest
      .spyOn(fse, "writeFileSync")
      .mockImplementation(jest.fn());
    vol.fromNestedJSON({
      "util/program-names": {
        "program-names.json": JSON.stringify({
          mips: "mips",
          cpcPlus: "cpcPlus",
          pcf: "pcf",
          app1: "app1",
          DEFAULT: "mips",
          G0053: "G0053",
        }),
      },
      "mvp/2024": {
        "mvp.json": JSON.stringify(mockMvpJson),
      },
    });

    updateProgramNames.updateProgramNames(2024);

    expect(writeSpy).toBeCalledWith(
      expect.any(String),
      JSON.stringify(
        {
          mips: "mips",
          cpcPlus: "cpcPlus",
          pcf: "pcf",
          app1: "app1",
          DEFAULT: "mips",
          G0053: "G0053",
          G0054: "G0054",
        },
        null,
        2
      )
    );
  });

  it("gracefully logs an error if json parsing fails.", () => {
    const writeSpy = jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation(jest.fn());
    const logSpy = jest.spyOn(console, "log").mockImplementationOnce(jest.fn());
    vol.fromNestedJSON({
      "util/program-names": {
        "program-names.json": "{'badformat':: 'mips','cpcPlus': 'cpcPlus'}",
      },
      "mvp/2024": {
        "mvp.json": JSON.stringify(mockMvpJson),
      },
    });

    updateProgramNames.updateProgramNames(2024);

    expect(writeSpy).not.toBeCalled();
    expect(logSpy).toBeCalled();
  });
});
