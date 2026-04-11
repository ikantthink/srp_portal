import type { ComponentConfig } from "@puckeditor/core";

export type DividerProps = { width: "full" | "medium" | "small" };

export const DividerConfig: ComponentConfig<DividerProps> = {
  fields: {
    width: {
      type: "radio",
      options: [
        { label: "Full", value: "full" },
        { label: "Medium", value: "medium" },
        { label: "Small", value: "small" },
      ],
    },
  },
  defaultProps: { width: "medium" },
  render: ({ width }) => {
    const widthClass = width === "full" ? "w-full" : width === "medium" ? "w-1/2" : "w-1/4";
    return (
      <div className="px-6 py-4">
        <hr className={`${widthClass} mx-auto border-border`} />
      </div>
    );
  },
};
