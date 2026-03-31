import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppSectionLabel } from "./AppSectionLabel";

const meta: Meta<typeof AppSectionLabel> = {
  title: "UI/AppSectionLabel",
  component: AppSectionLabel,
  args: {
    children: "Section Label",
  },
};

export default meta;
type Story = StoryObj<typeof AppSectionLabel>;

export const Default: Story = {};
