import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { Badge, Button, Card, CardContent, CardDescription, CardTitle, EmptyState, Input, LoadingState, SectionHeader, Textarea } from "../index";

describe("ui primitives", () => {
  it("renders button variants with the expected contract", () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button testID="primary-button" variant="default" onPress={onPress}>
        Save
      </Button>,
    );

    fireEvent.press(getByTestId("primary-button"));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(getByTestId("primary-button").props.accessibilityRole).toBe("button");
    expect(getByTestId("primary-button").props.className).toContain("bg-primary");
  });

  it("marks loading buttons busy and disabled", () => {
    const { getByTestId } = render(
      <Button testID="loading-button" loading>
        Saving
      </Button>,
    );

    expect(getByTestId("loading-button").props.accessibilityState).toEqual({ busy: true, disabled: true });
  });

  it("renders badge and card pieces", () => {
    const { getByText, getByTestId } = render(
      <Card testID="card">
        <CardContent>
          <CardTitle>Blue morpho</CardTitle>
          <CardDescription>Forest edge specimen</CardDescription>
          <Badge testID="badge">Specimen</Badge>
        </CardContent>
      </Card>,
    );

    expect(getByTestId("card").props.className).toContain("bg-card");
    expect(getByText("Blue morpho").props.className).toContain("font-serif");
    expect(getByTestId("badge").props.className).toContain("rounded-full");
  });

  it("renders empty and loading states", () => {
    const { getByText, getByTestId } = render(
      <>
        <LoadingState testID="loading" title="Loading butterflies" description="Pulling the local library together." />
        <EmptyState
          testID="empty"
          title="No specimens yet"
          description="Capture the first record to start the collection."
          action={<Text>Collect now</Text>}
        />
      </>,
    );

    expect(getByTestId("loading")).toBeTruthy();
    expect(getByText("No specimens yet")).toBeTruthy();
    expect(getByText("Collect now")).toBeTruthy();
  });

  it("renders form fields with labels and states", () => {
    const { getByTestId, getByText } = render(
      <>
        <Input testID="input" label="Chinese name" hint="Use the common local name" placeholder="蝴蝶名称" />
        <Textarea testID="textarea" label="Notes" error="Required" placeholder="Add notes" />
        <SectionHeader
          testID="section"
          eyebrow="Recording"
          title="Collection details"
          description="All the useful fields stay on one screen."
          action={<Text>Sort</Text>}
        />
      </>,
    );

    expect(getByTestId("input").props.className).toContain("border-border");
    expect(getByTestId("textarea").props.className).toContain("border-destructive");
    expect(getByText("Recording")).toBeTruthy();
    expect(getByTestId("section").props.className).toContain("justify-between");
  });
});
