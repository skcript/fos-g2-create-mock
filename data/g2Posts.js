// Mock G2 review posts. In real life these would come from the G2 reviews API.
// Each maps cleanly to a FeatureOS post (title + description).
export const g2Posts = [
  {
    id: "g2-1",
    title: "Add dark mode to the dashboard",
    reviewer: "Aisha K.",
    rating: 4.5,
    company: "Acme SaaS, 200-500 emp",
    description:
      "Love the product but staring at the bright dashboard all day is rough. A dark mode would be a huge quality-of-life win for our ops team.",
  },
  {
    id: "g2-2",
    title: "Bulk export reports as CSV",
    reviewer: "Marcus T.",
    rating: 4.0,
    company: "FinPivot, 50-200 emp",
    description:
      "Exporting reports one by one is painful. Please add a bulk CSV export so we can pull a quarter of data in one click.",
  },
  {
    id: "g2-3",
    title: "Native Slack notifications",
    reviewer: "Priya R.",
    rating: 5.0,
    company: "Looplane, 10-50 emp",
    description:
      "We live in Slack. A native integration that pings a channel when a ticket changes status would replace our janky Zapier flow.",
  },
  {
    id: "g2-4",
    title: "Role-based access control",
    reviewer: "Daniel V.",
    rating: 3.5,
    company: "GridNorth, 500+ emp",
    description:
      "For enterprise rollout we need granular RBAC. Right now everyone effectively has admin which fails our security review.",
  },
  {
    id: "g2-5",
    title: "Mobile app for approvals",
    reviewer: "Sofia L.",
    rating: 4.0,
    company: "Bytewell, 200-500 emp",
    description:
      "Managers want to approve requests on the go. A lightweight mobile app focused on approvals would speed up our cycle time.",
  },
];
