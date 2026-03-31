import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppButton } from "./AppButton";

const meta: Meta<typeof AppButton> = {
  title: "UI/AppButton",
  component: AppButton,
  args: {
    children: "Button",
    tone: "primary",
  },
};

export default meta;
type Story = StoryObj<typeof AppButton>;

export const Primary: Story = {};

export const Outline: Story = {
  args: {
    tone: "outline",
    children: "Outline",
  },
};

export const Ghost: Story = {
  args: {
    tone: "ghost",
    children: "Ghost",
  },
};
