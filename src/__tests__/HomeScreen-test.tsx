import { render } from "@testing-library/react-native";
import React from "react";
import App from "../App";

describe("HomeScreen", () => {
  it("renders default elements", () => {
    const { getByText, getByTestId } = render(<App />);

    // Verify welcome text is present
    expect(
      getByText("Open up App.tsx to start working on yossssssusr app!")
    ).toBeTruthy();
    // Verify Canvas element exists
    expect(getByTestId("canvas")).toBeTruthy();
  });
});
