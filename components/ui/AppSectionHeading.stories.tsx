import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppSectionHeading } from "./AppSectionHeading";

const meta: Meta<typeof AppSectionHeading> = {
  title: "UI/AppSectionHeading",
  component: AppSectionHeading,
  args: {
    label: "Section",
    title: "Heading Title",
    subtitle: "Optional subtitle text for this section header.",
  },
};

export default meta;
type Story = StoryObj<typeof AppSectionHeading>;

export const Default: Story = {
  render: (args) => <AppSectionHeading {...args} className="w-[640px]" />,
};
