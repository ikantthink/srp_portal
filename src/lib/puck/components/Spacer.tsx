import type { ComponentConfig } from "@puckeditor/core";

export type SpacerProps = { height: number };

export const SpacerConfig: ComponentConfig<SpacerProps> = {
  fields: { height: { type: "number" } },
  defaultProps: { height: 48 },
  render: ({ height }) => <div style={{ height }} />,
};
