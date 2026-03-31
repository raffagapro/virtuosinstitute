import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppCheckItem } from "./AppCheckItem";

const meta: Meta<typeof AppCheckItem> = {
  title: "UI/AppCheckItem",
  component: AppCheckItem,
  args: {
    children: "Reusable checklist row",
  },
};

export default meta;
type Story = StoryObj<typeof AppCheckItem>;

export const Default: Story = {
  render: (args) => (
    <ul>
      <AppCheckItem {...args} />
    </ul>
  ),
};

export const Inline: Story = {
  render: () => <AppCheckItem as="div">Inline check row for cards</AppCheckItem>,
};
