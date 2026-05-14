import { render } from "@testing-library/react-native";
import { Text } from "react-native";

import { Screen, ScreenHeader } from "../index";

describe("screen layout helpers", () => {
  it("renders a padded screen container with background accents", () => {
    const { getByTestId } = render(
      <Screen testID="screen">
        <Text>Workspace</Text>
      </Screen>,
    );

    expect(getByTestId("screen").props.className).toContain("bg-background");
  });

  it("renders a sticky-ish screen header with title and subtitle", () => {
    const { getByTestId, getByText } = render(
      <ScreenHeader
        testID="header"
        eyebrow="Now collecting"
        title="Butterflies"
        subtitle="Local-first records and AI-assisted identification."
      />,
    );

    expect(getByTestId("header").props.className).toContain("border-b");
    expect(getByText("Butterflies")).toBeTruthy();
    expect(getByText("Now collecting")).toBeTruthy();
  });
});
